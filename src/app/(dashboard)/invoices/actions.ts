'use server';

import { createClient } from '@/lib/supabase/server';

// Helper: get current user's org_id
async function getOrgId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    return profile?.org_id || null;
}

export async function getInvoices(filters?: { month?: string; building_id?: string; status?: string }) {
    const supabase = await createClient();

    let query = supabase
        .from('invoices')
        .select('*, room:rooms(name), building:buildings(name), tenant:tenants(full_name)')
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

    // 3. Lấy chỉ số đồng hồ điện/nước cho tháng này
    const roomIds = contracts.map(c => c.room_id);
    const { data: meters, error: metersError } = await supabase
        .from('meter_records')
        .select('*')
        .eq('record_month', month)
        .in('room_id', roomIds);

    if (metersError) return { error: `Lỗi lấy chỉ số đồng hồ: ${metersError.message}` };

    let generatedCount = 0;

    // Process each contract
    for (const contract of contracts) {
        // Kiểm tra xem phòng này đã có hoá đơn của tháng chưa
        const { data: existing } = await supabase
            .from('invoices')
            .select('id')
            .eq('room_id', contract.room_id)
            .eq('month', month)
            .single();

        if (existing) continue; // Bỏ qua nếu đã tạo

        // a. Tạo bản ghi invoice
        const date = new Date();
        date.setDate(date.getDate() + 5); // Tự động set hạn thanh toán là 5 ngày sau
        const dueDate = date.toISOString().split('T')[0];

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
            })
            .select()
            .single();

        if (invoiceError || !invoice) continue;

        const invoiceItems: { invoice_id: string; type: string; description: string; quantity: number; unit_price: number; amount: number; reference_id?: string }[] = [];

        // b. Thêm mục Tiền phòng
        invoiceItems.push({
            invoice_id: invoice.id,
            type: 'rent',
            description: `Tiền thuê phòng tháng ${month}`,
            quantity: 1,
            unit_price: contract.rent_amount,
            amount: contract.rent_amount
        });

        // c. Thêm các mục dịch vụ tính theo đồng hồ (Điện, Nước)
        const meteredPrices = prices.filter(p => p.is_metered);
        const meter = meters?.find(m => m.room_id === contract.room_id);

        for (const price of meteredPrices) {
            if (meter) {
                if (price.service_type === 'electricity') {
                    invoiceItems.push({
                        invoice_id: invoice.id,
                        type: 'electricity',
                        description: `${price.label} (${meter.electricity_old} - ${meter.electricity_new})`,
                        quantity: meter.electricity_usage,
                        unit_price: price.unit_price,
                        amount: meter.electricity_usage * price.unit_price,
                        reference_id: meter.id
                    });
                } else if (price.service_type === 'water') {
                    invoiceItems.push({
                        invoice_id: invoice.id,
                        type: 'water',
                        description: `${price.label} (${meter.water_old} - ${meter.water_new})`,
                        quantity: meter.water_usage,
                        unit_price: price.unit_price,
                        amount: meter.water_usage * price.unit_price,
                        reference_id: meter.id
                    });
                }
            }
        }

        // d. Thêm các mục dịch vụ cố định (Rác, Internet, Wifi)
        const fixedPrices = prices.filter(p => !p.is_metered);
        for (const price of fixedPrices) {
            invoiceItems.push({
                invoice_id: invoice.id,
                type: 'service',
                description: price.label,
                quantity: 1, // Thông thường tính trên phòng
                unit_price: price.unit_price,
                amount: price.unit_price
            });
        }

        // Lưu toàn bộ chi tiết hoá đơn
        if (invoiceItems.length > 0) {
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

    // Lấy số tiền đã thanh toán hiện tại
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('paid_amount, total_amount')
        .eq('id', id)
        .single();

    if (fetchError || !invoice) return { error: 'Không tìm thấy hoá đơn' };

    const newPaidAmount = Number(invoice.paid_amount) + Number(amount);

    // Lưu ý: Trigger CSDL sẽ tự động tính toán lại trường 'status' dựa trên paid_amount và total_amount
    const { error: updateError } = await supabase
        .from('invoices')
        .update({ paid_amount: newPaidAmount })
        .eq('id', id);

    if (updateError) return { error: updateError.message };
    return { success: true };
}

export async function deleteInvoice(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) return { error: error.message };
    return { success: true };
}
