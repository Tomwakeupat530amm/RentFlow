'use server';

import { createClient } from '@/lib/supabase/server';
import { getOrgId } from '@/lib/rbac/guard';

export async function checkMeterReadiness(buildingId: string, month: string) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { data: null, error: 'Chưa đăng nhập' };

    // Get all active contracts in this building
    const { data: contracts } = await supabase
        .from('contracts')
        .select('room_id, room:rooms!inner(id, building_id, name)')
        .eq('status', 'active')
        .is('deleted_at', null)
        .eq('rooms.building_id', buildingId);

    if (!contracts || contracts.length === 0) {
        return { data: { total: 0, entered: 0, missing: [] }, error: null };
    }

    const roomIds = contracts.map((c) => (c as unknown as { room_id: string }).room_id);

    // Get meter records for this month (check both electricity and water)
    const { data: meters } = await supabase
        .from('meter_records')
        .select('room_id')
        .eq('period', month)
        .in('room_id', roomIds);

    const enteredRoomIds = new Set(meters?.map((m) => (m as unknown as { room_id: string }).room_id) || []);
    const missingRooms = contracts
        .filter((c) => !enteredRoomIds.has((c as unknown as { room_id: string }).room_id))
        .map((c) => ((c as unknown as { room?: { name?: string }; room_id: string }).room)?.name || (c as unknown as { room_id: string }).room_id);

    return {
        data: {
            total: contracts.length,
            entered: enteredRoomIds.size,
            missing: missingRooms,
        },
        error: null,
    };
}

export async function getInvoices(filters?: { month?: string; building_id?: string; status?: string }) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { data: null, error: 'Chưa đăng nhập' };

    let query = supabase
        .from('invoices')
        .select('*, room:rooms(name), building:buildings(name), tenant:tenants(full_name)')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (filters?.month) query = query.eq('month', filters.month);
    if (filters?.building_id && filters.building_id !== 'all') query = query.eq('building_id', filters.building_id);
    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function getInvoiceById(id: string) {
    const supabase = await createClient();

    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, room:rooms(name), building:buildings(name, address), tenant:tenants(full_name, phone)')
        .eq('id', id)
        .single();

    if (invoiceError) return { data: null, error: invoiceError.message };

    const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true });

    if (itemsError) return { data: null, error: itemsError.message };

    const { data: paymentSettings } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('org_id', invoice.org_id)
        .single();

    return { data: { ...invoice, items, paymentSettings }, error: null };
}

export async function generateInvoices(buildingId: string, month: string) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Không tìm thấy tổ chức. Vui lòng đăng nhập lại.' };

    // 1. Lấy tất cả hợp đồng đang hiệu lực trong toà nhà
    const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*, room:rooms!inner(id, building_id, name)')
        .eq('status', 'active')
        .is('deleted_at', null)
        .eq('rooms.building_id', buildingId);

    if (contractsError) return { error: `Lỗi lấy hợp đồng: ${contractsError.message}` };
    if (!contracts || contracts.length === 0) return { error: 'Không có hợp đồng nào đang hoạt động trong toà nhà này.' };

    // 2. Lấy bảng giá dịch vụ cho toà nhà
    const { data: prices, error: pricesError } = await supabase
        .from('service_prices')
        .select('*')
        .eq('building_id', buildingId);

    if (pricesError) return { error: `Lỗi lấy bảng giá dịch vụ: ${pricesError.message}` };

    // 3. Lấy chỉ số đồng hồ điện/nước cho tháng này (cột trong DB là period)
    const roomIds = contracts.map(c => c.room_id);
    const { data: meters, error: metersError } = await supabase
        .from('meter_records')
        .select('*')
        .eq('period', month)
        .in('room_id', roomIds);

    if (metersError) return { error: `Lỗi lấy chỉ số đồng hồ: ${metersError.message}` };

    // 4. Lấy danh sách toàn bộ hoá đơn đã tạo trong tháng của toà nhà (1 câu query duy nhất)
    const { data: existingInvoices, error: existingError } = await supabase
        .from('invoices')
        .select('room_id')
        .eq('building_id', buildingId)
        .eq('month', month)
        .eq('org_id', orgId);

    if (existingError) return { error: `Lỗi kiểm tra hóa đơn: ${existingError.message}` };

    const existingRoomIds = new Set(existingInvoices?.map(i => i.room_id) || []);
    const contractsToGenerate = contracts.filter(c => !existingRoomIds.has(c.room_id));

    if (contractsToGenerate.length === 0) {
        return { success: true, message: 'Tất cả các phòng đang hoạt động đều đã có hoá đơn cho tháng này.' };
    }

    const date = new Date();
    date.setDate(date.getDate() + 5); // Tự động set hạn thanh toán là 5 ngày sau
    const dueDate = date.toISOString().split('T')[0];

    let generatedCount = 0;

    // Process each contract
    for (const contract of contractsToGenerate) {
        // a. Tính toán toàn bộ các mục chi tiết trước để xác định chính xác total_amount
        const rawItems: { type: string; description: string; quantity: number; unit_price: number; amount: number; reference_id?: string }[] = [];

        // Tiền phòng
        rawItems.push({
            type: 'rent',
            description: `Tiền thuê phòng tháng ${month}`,
            quantity: 1,
            unit_price: contract.rent_amount,
            amount: contract.rent_amount
        });

        // Mục dịch vụ tính theo đồng hồ (Điện, Nước)
        const meteredPrices = prices.filter(p => p.is_metered || p.charging_rule === 'metered');
        const roomMeters = meters?.filter(m => m.room_id === contract.room_id) || [];

        for (const price of meteredPrices) {
            const meter = roomMeters.find(m => m.service_type === price.service_type);
            if (meter) {
                const oldReading = Number(meter.old_reading ?? meter.electricity_old ?? meter.water_old ?? 0);
                const newReading = Number(meter.new_reading ?? meter.electricity_new ?? meter.water_new ?? 0);
                const usage = Number(meter.usage ?? (newReading - oldReading > 0 ? newReading - oldReading : 0));
                const itemAmount = usage * Number(price.unit_price);

                rawItems.push({
                    type: price.service_type,
                    description: `${price.label} (${oldReading} - ${newReading})`,
                    quantity: usage,
                    unit_price: price.unit_price,
                    amount: itemAmount,
                    reference_id: meter.id
                });
            }
        }

        // Mục dịch vụ cố định, theo người, hoặc theo xe
        const nonMeteredPrices = prices.filter(p => !p.is_metered && p.charging_rule !== 'metered');
        for (const price of nonMeteredPrices) {
            let quantity = 1;
            let qtyDescription = '';

            if (price.charging_rule === 'per_person' || price.unit?.includes('người')) {
                quantity = Math.max(1, Number(contract.num_occupants || 1));
                qtyDescription = ` (${quantity} người)`;
            } else if (price.charging_rule === 'per_vehicle' || price.unit?.includes('xe')) {
                quantity = Math.max(0, Number(contract.num_vehicles || 0));
                qtyDescription = ` (${quantity} xe)`;
            }

            // Nếu phí theo xe mà phòng không đăng ký xe nào thì không tính tiền
            if ((price.charging_rule === 'per_vehicle' || price.unit?.includes('xe')) && quantity === 0) {
                continue;
            }

            const itemAmount = quantity * Number(price.unit_price);

            rawItems.push({
                type: 'service',
                description: `${price.label}${qtyDescription}`,
                quantity: quantity,
                unit_price: price.unit_price,
                amount: itemAmount
            });
        }

        const totalAmount = rawItems.reduce((sum, item) => sum + Number(item.amount), 0);

        // b. Tạo hoá đơn kèm sẵn total_amount (chống tình trạng total_amount = 0 nếu gặp sự cố giữa chừng)
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                org_id: orgId,
                building_id: buildingId,
                room_id: contract.room_id,
                contract_id: contract.id,
                tenant_id: contract.tenant_id,
                month: month,
                title: `Hoá đơn tháng ${month} - Phòng ${contract.room.name}`,
                due_date: dueDate,
                total_amount: totalAmount,
                paid_amount: 0,
                status: 'unpaid',
            })
            .select('id')
            .single();

        if (invoiceError || !invoice) {
            console.error('Lỗi tạo hoá đơn:', invoiceError);
            continue;
        }

        // c. Chèn toàn bộ chi tiết hoá đơn trong 1 lượt
        if (rawItems.length > 0) {
            const invoiceItems = rawItems.map(item => ({ ...item, invoice_id: invoice.id }));
            await supabase.from('invoice_items').insert(invoiceItems);
        }

        generatedCount++;
    }

    if (generatedCount === 0) {
        return { success: true, message: 'Tất cả các phòng đang hoạt động đều đã có hoá đơn cho tháng này.' };
    }

    return {
        success: true,
        message: `Đã tạo thành công hoá đơn cho ${generatedCount} phòng.`
    };
}

export async function payInvoice(id: string, amount: number) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Chưa đăng nhập' };

    // Lấy số tiền đã thanh toán hiện tại
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('paid_amount, total_amount')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

    if (fetchError || !invoice) return { error: 'Không tìm thấy hoá đơn' };

    const newPaidAmount = Number(invoice.paid_amount) + Number(amount);

    // Lưu ý: Trigger CSDL sẽ tự động tính toán lại trường 'status' dựa trên paid_amount và total_amount
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ paid_amount: newPaidAmount })
        .eq('id', id)
        .eq('org_id', orgId);

    if (updateError) return { error: updateError.message };
    return { success: true };
}

export async function deleteInvoice(id: string) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Chưa đăng nhập' };

    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) return { error: error.message };
    return { success: true };
}

export async function getZaloInvoiceMessage(invoiceId: string) {
    const supabase = await createClient();
    const { data: invoiceRes, error } = await getInvoiceById(invoiceId);
    if (error || !invoiceRes) {
        return { success: false, error: error || 'Không tìm thấy hóa đơn' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = invoiceRes as any;
    const items = invoice.items || [];
    const paymentSettings = invoice.paymentSettings;
    const room = invoice.room;
    const building = invoice.building;
    const tenant = invoice.tenant;

    // Lấy chỉ số điện nước kỳ này
    const { data: meterRecords } = await supabase
        .from('meter_records')
        .select('*')
        .eq('room_id', invoice.room_id)
        .eq('period', invoice.month);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elecMeter = meterRecords?.find((m: any) => m.service_type === 'electricity');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const waterMeter = meterRecords?.find((m: any) => m.service_type === 'water');

    const bankBin = paymentSettings?.bank_bin || '970415';
    const bankAccount = paymentSettings?.bank_account || '113366668888';
    const accountName = paymentSettings?.account_name || 'CHU NHA';
    const qrTemplate = paymentSettings?.qr_template || 'compact2';

    const remainingAmount = Math.max(0, Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0));
    const transferMemo = invoice.order_code ? `RF ${invoice.order_code}` : `HD ${invoice.id.substring(0, 6).toUpperCase()}`;
    const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-${qrTemplate}.png?amount=${remainingAmount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(accountName)}`;

    const lines: string[] = [];
    lines.push(`🏠 THÔNG BÁO TIỀN PHÒNG THÁNG ${invoice.month}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📍 Phòng: ${room?.name || '---'}${building?.name ? ` (${building.name})` : ''}`);
    lines.push(`👤 Khách thuê: ${tenant?.full_name || 'Quý khách'}`);
    lines.push(`📅 Ngày tạo: ${new Date(invoice.created_at).toLocaleDateString('vi-VN')}`);
    lines.push(``);
    lines.push(`📋 CHI TIẾT CÁC KHOẢN PHÍ:`);

    let itemIndex = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of items) {
        if (item.type === 'electricity' && elecMeter) {
            lines.push(`${itemIndex++}. Tiền điện: ${elecMeter.new_reading} - ${elecMeter.old_reading} = ${elecMeter.usage} kWh x ${Number(item.unit_price).toLocaleString()} đ = ${Number(item.amount).toLocaleString()} đ`);
        } else if (item.type === 'water' && waterMeter) {
            lines.push(`${itemIndex++}. Tiền nước: ${waterMeter.new_reading} - ${waterMeter.old_reading} = ${waterMeter.usage} m3 x ${Number(item.unit_price).toLocaleString()} đ = ${Number(item.amount).toLocaleString()} đ`);
        } else {
            const qtyText = item.quantity > 1 ? ` (${item.quantity} x ${Number(item.unit_price).toLocaleString()} đ)` : '';
            lines.push(`${itemIndex++}. ${item.description}: ${Number(item.amount).toLocaleString()} đ${qtyText}`);
        }
    }

    lines.push(`────────────────────`);
    lines.push(`💰 TỔNG CỘNG: ${Number(invoice.total_amount).toLocaleString()} đ`);
    if (Number(invoice.paid_amount) > 0) {
        lines.push(`💵 Đã thanh toán: ${Number(invoice.paid_amount).toLocaleString()} đ`);
        lines.push(`👉 CÒN LẠI CẦN ĐÓNG: ${remainingAmount.toLocaleString()} đ`);
    }
    if (invoice.due_date) {
        lines.push(`⏰ Hạn thanh toán: ${new Date(invoice.due_date).toLocaleDateString('vi-VN')}`);
    }

    lines.push(``);
    lines.push(`💳 THÔNG TIN CHUYỂN KHOẢN:`);
    lines.push(`• Ngân hàng: ${paymentSettings?.bank_name || 'Ngân hàng'} (BIN: ${bankBin})`);
    lines.push(`• Số tài khoản: ${bankAccount}`);
    lines.push(`• Chủ tài khoản: ${accountName.toUpperCase()}`);
    lines.push(`• Số tiền: ${remainingAmount.toLocaleString()} đ`);
    lines.push(`• Nội dung CK: ${transferMemo}`);
    lines.push(``);
    lines.push(`📲 Quét mã VietQR chuyển khoản nhanh:`);
    lines.push(`${vietQrUrl}`);
    lines.push(``);
    lines.push(`Trân trọng cảm ơn bạn! 🙏`);

    // Mẫu tin nhắn nhắc nợ / gia hạn thanh toán
    const reminderLines: string[] = [];
    const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date();
    const daysOverdue = invoice.due_date ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0;

    reminderLines.push(`🔔 NHẮC THANH TOÁN TIỀN PHÒNG ${isOverdue ? `(QUÁ HẠN ${daysOverdue} NGÀY)` : ''}`.trim());
    reminderLines.push(`━━━━━━━━━━━━━━━━━━━━`);
    reminderLines.push(`Xin chào ${tenant?.full_name || 'bạn'},`);
    reminderLines.push(`Hệ thống xin phép gửi lời nhắc về khoản tiền phòng tháng ${invoice.month}:`);
    reminderLines.push(`📍 Phòng: ${room?.name || '---'}${building?.name ? ` (${building.name})` : ''}`);
    reminderLines.push(`💰 Số tiền cần thanh toán: ${remainingAmount.toLocaleString()} đ`);
    if (invoice.due_date) {
        reminderLines.push(`⏰ Hạn thanh toán: ${new Date(invoice.due_date).toLocaleDateString('vi-VN')}`);
    }
    reminderLines.push(``);
    reminderLines.push(`💳 THÔNG TIN CHUYỂN KHOẢN:`);
    reminderLines.push(`• Ngân hàng: ${paymentSettings?.bank_name || 'Ngân hàng'} (BIN: ${bankBin})`);
    reminderLines.push(`• Số tài khoản: ${bankAccount}`);
    reminderLines.push(`• Chủ tài khoản: ${accountName.toUpperCase()}`);
    reminderLines.push(`• Số tiền: ${remainingAmount.toLocaleString()} đ`);
    reminderLines.push(`• Nội dung CK: ${transferMemo}`);
    reminderLines.push(``);
    reminderLines.push(`📲 Quét mã VietQR chuyển khoản nhanh:`);
    reminderLines.push(`${vietQrUrl}`);
    reminderLines.push(``);
    reminderLines.push(`Nếu bạn đã thanh toán, vui lòng bỏ qua tin nhắn này hoặc phản hồi lại giúp mình nhé.`);
    reminderLines.push(`Trân trọng cảm ơn bạn! 🙏`);

    return {
        success: true,
        message: lines.join('\n'),
        reminderMessage: reminderLines.join('\n'),
        vietQrUrl,
        transferMemo,
        remainingAmount,
        bankAccount,
        accountName,
        tenantPhone: tenant?.phone,
    };
}
