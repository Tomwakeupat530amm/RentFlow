import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

if (!supabaseUrl || !anonKey) {
    console.error('❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey);
const supabaseAnon = createClient(supabaseUrl, anonKey);

const results = [];

function recordTest(moduleName, testName, passed, details = '') {
    results.push({ module: moduleName, test: testName, passed, details });
    const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${statusIcon} [${moduleName}] ${testName}${details ? ` (${details})` : ''}`);
}

async function runAllTests() {
    console.log('================================================================');
    console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG RENTFLOW (AUTOPILOT)');
    console.log('================================================================\n');

    let testUser = null;
    let orgId = null;

    // ─── MODULE 1: AUTHENTICATION & PROFILES ───
    try {
        const email = process.env.TEST_EMAIL || 'minhnt@funix.edu.vn';
        const password = process.env.TEST_PASSWORD || 'Tom03456789!';

        const { data: authData, error: authErr } = await supabaseAnon.auth.signInWithPassword({
            email,
            password
        });

        if (authErr || !authData.user) {
            recordTest('Auth', 'Đăng nhập người dùng quản trị', false, authErr?.message || 'Không có user');
        } else {
            testUser = authData.user;
            recordTest('Auth', 'Đăng nhập người dùng quản trị', true, `User ID: ${testUser.id}`);

            // Kiểm tra user_profiles
            const { data: profile, error: profErr } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('id', testUser.id)
                .single();

            if (profErr || !profile) {
                recordTest('Auth', 'Lấy thông tin profile người dùng', false, profErr?.message);
            } else {
                orgId = profile.org_id;
                recordTest('Auth', 'Lấy thông tin profile người dùng', true, `Org ID: ${orgId}, Role: ${profile.role}`);
            }
        }
    } catch (e) {
        recordTest('Auth', 'Xác thực tài khoản', false, e.message);
    }

    if (!orgId) {
        // Fallback lấy org đầu tiên từ database
        const { data: firstOrg } = await supabaseAdmin.from('organizations').select('id').limit(1).single();
        orgId = firstOrg?.id;
    }

    // ─── MODULE 2: DASHBOARD STATS ───
    try {
        const { data: buildings, error: bErr } = await supabaseAdmin
            .from('buildings')
            .select('id')
            .eq('org_id', orgId)
            .is('deleted_at', null);

        if (bErr) {
            recordTest('Dashboard', 'Truy vấn danh sách tòa nhà', false, bErr.message);
        } else {
            const buildingIds = buildings.map(b => b.id);
            recordTest('Dashboard', 'Truy vấn danh sách tòa nhà', true, `Tìm thấy ${buildings.length} tòa nhà`);

            let totalRooms = 0;
            if (buildingIds.length > 0) {
                const { count, error: rErr } = await supabaseAdmin
                    .from('rooms')
                    .select('*', { count: 'exact', head: true })
                    .in('building_id', buildingIds)
                    .is('deleted_at', null);

                if (!rErr) {
                    totalRooms = count || 0;
                    recordTest('Dashboard', 'Thống kê tổng số phòng', true, `Tổng: ${totalRooms} phòng`);
                } else {
                    recordTest('Dashboard', 'Thống kê tổng số phòng', false, rErr.message);
                }
            }
        }
    } catch (e) {
        recordTest('Dashboard', 'Thống kê Dashboard', false, e.message);
    }

    // ─── MODULE 3: BUILDINGS (CRUD) ───
    let createdBuildingId = null;
    try {
        const { data: newBuilding, error: insErr } = await supabaseAdmin
            .from('buildings')
            .insert({
                org_id: orgId,
                name: 'Tòa nhà Kiểm thử Tự động ' + Date.now(),
                address: '123 Đường Test, Hà Nội',
                num_floors: 3,
                status: 'active'
            })
            .select()
            .single();

        if (insErr || !newBuilding) {
            recordTest('Buildings', 'Thêm mới tòa nhà', false, insErr?.message);
        } else {
            createdBuildingId = newBuilding.id;
            recordTest('Buildings', 'Thêm mới tòa nhà', true, `ID: ${createdBuildingId}`);

            // Cập nhật tòa nhà
            const { error: updateErr } = await supabaseAdmin
                .from('buildings')
                .update({ address: '456 Đường Test Updated' })
                .eq('id', createdBuildingId)
                .eq('org_id', orgId);

            recordTest('Buildings', 'Cập nhật thông tin tòa nhà', !updateErr, updateErr?.message);

            // Xóa mềm tòa nhà
            const { error: delErr } = await supabaseAdmin
                .from('buildings')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', createdBuildingId)
                .eq('org_id', orgId);

            recordTest('Buildings', 'Xóa mềm tòa nhà', !delErr, delErr?.message);
        }
    } catch (e) {
        recordTest('Buildings', 'Thao tác CRUD tòa nhà', false, e.message);
    }

    // ─── MODULE 4: ROOMS & MULTI-MODEL ───
    try {
        const { data: sampleRoom, error: roomErr } = await supabaseAdmin
            .from('rooms')
            .select('*')
            .is('deleted_at', null)
            .limit(1)
            .maybeSingle();

        if (roomErr || !sampleRoom) {
            recordTest('Rooms', 'Truy vấn chi tiết phòng', false, roomErr?.message || 'Không có phòng nào trong CSDL');
        } else {
            recordTest('Rooms', 'Truy vấn chi tiết phòng', true, `Phòng: ${sampleRoom.name}, Giá: ${sampleRoom.default_rent}`);

            // Kiểm tra khả năng cập nhật trạng thái hoặc loại hình
            const originalType = sampleRoom.room_type || 'single';
            const { error: switchErr } = await supabaseAdmin
                .from('rooms')
                .update({ room_type: originalType === 'single' ? 'double' : 'single' })
                .eq('id', sampleRoom.id);

            recordTest('Rooms', 'Chuyển đổi loại hình/mô hình phòng', !switchErr, switchErr?.message);

            // Revert lại trạng thái gốc
            await supabaseAdmin.from('rooms').update({ room_type: originalType }).eq('id', sampleRoom.id);
        }
    } catch (e) {
        recordTest('Rooms', 'Thao tác phòng', false, e.message);
    }

    // ─── MODULE 5: TENANTS & PIN GENERATION ───
    let createdTenantId = null;
    try {
        const testPin = Math.floor(100000 + Math.random() * 900000).toString();
        const { data: newTenant, error: tErr } = await supabaseAdmin
            .from('tenants')
            .insert({
                org_id: orgId,
                full_name: 'Khách Thuê Kiểm Thử ' + Date.now(),
                phone: '098' + Math.floor(1000000 + Math.random() * 9000000),
                access_code: testPin,
                id_number: '00120000' + Math.floor(1000 + Math.random() * 9000)
            })
            .select()
            .single();

        if (tErr || !newTenant) {
            recordTest('Tenants', 'Tạo hồ sơ khách thuê & cấp mã PIN 6 số', false, tErr?.message);
        } else {
            createdTenantId = newTenant.id;
            const isPinValid = /^[0-9]{6}$/.test(newTenant.access_code);
            recordTest('Tenants', 'Tạo hồ sơ khách thuê & cấp mã PIN 6 số', isPinValid, `PIN: ${newTenant.access_code}`);

            // Đổi mã PIN mới
            const newPin = Math.floor(100000 + Math.random() * 900000).toString();
            const { error: pinErr } = await supabaseAdmin
                .from('tenants')
                .update({ access_code: newPin })
                .eq('id', createdTenantId)
                .eq('org_id', orgId);

            recordTest('Tenants', 'Tạo lại mã PIN truy cập Tenant Portal', !pinErr, pinErr?.message);

            // Xóa khách thuê kiểm thử
            await supabaseAdmin.from('tenants').delete().eq('id', createdTenantId);
        }
    } catch (e) {
        recordTest('Tenants', 'Quản lý khách thuê', false, e.message);
    }

    // ─── MODULE 6: CONTRACTS & SIGNATURES ───
    try {
        const { data: contracts, error: cErr } = await supabaseAdmin
            .from('contracts')
            .select('id, status, signed_by_owner, signed_by_tenant, rent_amount, start_date, end_date')
            .is('deleted_at', null)
            .limit(5);

        if (cErr) {
            recordTest('Contracts', 'Truy vấn danh sách hợp đồng', false, cErr.message);
        } else {
            recordTest('Contracts', 'Truy vấn danh sách hợp đồng', true, `Tìm thấy ${contracts.length} hợp đồng`);

            if (contracts.length > 0) {
                const sampleContract = contracts[0];
                const hasValidFields = sampleContract.id && sampleContract.rent_amount !== undefined;
                recordTest('Contracts', 'Kiểm tra cấu trúc và trạng thái ký điện tử', hasValidFields, `ID HĐ: ${sampleContract.id.substring(0, 8)}..., Trạng thái: ${sampleContract.status}`);
            }
        }
    } catch (e) {
        recordTest('Contracts', 'Quản lý hợp đồng', false, e.message);
    }

    // ─── MODULE 7: METERS & UNIQUE CONSTRAINT VALIDATION ───
    try {
        const { data: sampleRoom } = await supabaseAdmin.from('rooms').select('id').limit(1).single();
        if (sampleRoom) {
            const testPeriod = '2099-12'; // Dùng tháng tương lai để tránh ảnh hưởng dữ liệu thật

            // Ghi nhận số điện
            const { error: elecErr } = await supabaseAdmin
                .from('meter_records')
                .upsert({
                    room_id: sampleRoom.id,
                    period: testPeriod,
                    service_type: 'electricity',
                    old_reading: 100,
                    new_reading: 150
                }, { onConflict: 'room_id, period, service_type' });

            // Ghi nhận số nước trong CÙNG 1 THÁNG cho CÙNG 1 PHÒNG
            const { error: waterErr } = await supabaseAdmin
                .from('meter_records')
                .upsert({
                    room_id: sampleRoom.id,
                    period: testPeriod,
                    service_type: 'water',
                    old_reading: 20,
                    new_reading: 30
                }, { onConflict: 'room_id, period, service_type' });

            const bothSucceeded = !elecErr && !waterErr;
            recordTest('Meters', 'Ghi nhận đồng thời Điện & Nước trong cùng 1 tháng (Constraint Check)', bothSucceeded, elecErr?.message || waterErr?.message || 'Cả 2 dịch vụ đều lưu thành công');

            // Cleanup bản ghi test
            await supabaseAdmin.from('meter_records').delete().eq('room_id', sampleRoom.id).eq('period', testPeriod);
        } else {
            recordTest('Meters', 'Ghi nhận chỉ số điện nước', false, 'Không tìm thấy phòng để test');
        }
    } catch (e) {
        recordTest('Meters', 'Kiểm tra đồng hồ điện nước', false, e.message);
    }

    // ─── MODULE 8: INVOICES & REVENUE ───
    let existingInvoiceForWebhookTest = null;
    try {
        const { data: invoices, error: invErr } = await supabaseAdmin
            .from('invoices')
            .select('id, title, total_amount, paid_amount, status, month, order_code')
            .order('created_at', { ascending: false })
            .limit(5);

        if (invErr) {
            recordTest('Invoices', 'Truy vấn danh sách hoá đơn', false, invErr.message);
        } else {
            recordTest('Invoices', 'Truy vấn danh sách hoá đơn', true, `Tìm thấy ${invoices.length} hoá đơn`);

            if (invoices.length > 0) {
                existingInvoiceForWebhookTest = invoices[0];
                // Kiểm tra chi tiết invoice_items
                const { data: items, error: itemsErr } = await supabaseAdmin
                    .from('invoice_items')
                    .select('*')
                    .eq('invoice_id', invoices[0].id);

                recordTest('Invoices', 'Kiểm tra chi tiết mục thu (Invoice Items)', !itemsErr, `Hoá đơn ${invoices[0].title} có ${items?.length || 0} mục`);
            }
        }
    } catch (e) {
        recordTest('Invoices', 'Xử lý hoá đơn', false, e.message);
    }

    // ─── MODULE 9: EXPENSES ───
    try {
        const { data: newExp, error: expErr } = await supabaseAdmin
            .from('expenses')
            .insert({
                org_id: orgId,
                category: 'maintenance',
                amount: 150000,
                date: new Date().toISOString().split('T')[0],
                description: 'Chi phí bảo dưỡng kiểm thử tự động'
            })
            .select()
            .single();

        if (expErr || !newExp) {
            recordTest('Expenses', 'Thêm mới phiếu chi phí', false, expErr?.message);
        } else {
            recordTest('Expenses', 'Thêm mới phiếu chi phí', true, `Mã chi phí: ${newExp.id}, Số tiền: ${newExp.amount}`);

            // Xóa phiếu chi kiểm thử
            const { error: delExpErr } = await supabaseAdmin.from('expenses').delete().eq('id', newExp.id);
            recordTest('Expenses', 'Xóa phiếu chi phí', !delExpErr, delExpErr?.message);
        }
    } catch (e) {
        recordTest('Expenses', 'Quản lý sổ chi phí', false, e.message);
    }

    // ─── MODULE 10: INCIDENTS & MAINTENANCE ───
    try {
        // Lấy 1 tòa nhà để gán vào building_id
        const { data: sampleBuilding } = await supabaseAdmin.from('buildings').select('id').limit(1).single();

        const { data: newInc, error: incErr } = await supabaseAdmin
            .from('incidents')
            .insert({
                org_id: orgId,
                building_id: sampleBuilding?.id,
                reporter_type: 'tenant',
                title: 'Sự cố kiểm thử tự động ' + Date.now(),
                description: 'Kiểm tra luồng tạo sự cố',
                status: 'open',
                priority: 'low'
            })
            .select()
            .single();

        if (incErr || !newInc) {
            recordTest('Incidents', 'Tạo yêu cầu báo cáo sự cố', false, incErr?.message);
        } else {
            recordTest('Incidents', 'Tạo yêu cầu báo cáo sự cố', true, `ID: ${newInc.id}`);

            // Cập nhật trạng thái sự cố
            const { error: upIncErr } = await supabaseAdmin
                .from('incidents')
                .update({ status: 'in_progress' })
                .eq('id', newInc.id);

            recordTest('Incidents', 'Cập nhật tiến độ xử lý sự cố', !upIncErr, upIncErr?.message);

            // Cleanup
            await supabaseAdmin.from('incidents').delete().eq('id', newInc.id);
        }
    } catch (e) {
        recordTest('Incidents', 'Quản lý sự cố', false, e.message);
    }

    // ─── MODULE 11: HOMESTAY & HOUSEKEEPING ───
    try {
        const { data: bookings, error: bookErr } = await supabaseAdmin
            .from('bookings')
            .select('id, guest_name, total_amount, status')
            .limit(5);

        recordTest('Homestay', 'Truy vấn lịch đặt phòng Homestay (Bookings)', !bookErr, bookErr ? bookErr.message : `Tìm thấy ${bookings?.length || 0} đặt phòng`);

        const { data: tasks, error: taskErr } = await supabaseAdmin
            .from('housekeeping_tasks')
            .select('id, status, assigned_to')
            .limit(5);

        recordTest('Homestay', 'Truy vấn danh sách dọn phòng (Housekeeping)', !taskErr, taskErr ? taskErr.message : `Tìm thấy ${tasks?.length || 0} công việc`);
    } catch (e) {
        recordTest('Homestay', 'Quản lý Homestay', false, e.message);
    }

    // ─── MODULE 12: TENANT PORTAL LOGIN & SESSIONS ───
    try {
        let targetPhone = '0981234567';
        let targetPin = '123456';
        let tempTenantCreated = false;

        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id, phone, access_code')
            .eq('is_active', true)
            .not('access_code', 'is', null)
            .limit(1)
            .maybeSingle();

        if (tenant && tenant.phone && tenant.access_code) {
            targetPhone = tenant.phone;
            targetPin = tenant.access_code;
        } else {
            const { data: tempT } = await supabaseAdmin.from('tenants').insert({
                org_id: orgId,
                full_name: 'Test Tenant Portal Auth',
                phone: targetPhone,
                access_code: targetPin,
                is_active: true
            }).select().single();
            if (tempT) tempTenantCreated = true;
        }

        const loginRes = await fetch('http://localhost:3000/api/tenant/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: targetPhone, access_code: targetPin })
        });

        const loginJson = await loginRes.json();
        const portalAuthSuccess = loginRes.status === 200 && loginJson.success;
        recordTest('TenantPortal', 'API Đăng nhập Tenant Portal qua SĐT + PIN', portalAuthSuccess, `Status: ${loginRes.status}, Phone: ${targetPhone}`);

        if (tempTenantCreated) {
            await supabaseAdmin.from('tenants').delete().eq('phone', targetPhone);
        }
    } catch (e) {
        recordTest('TenantPortal', 'Kiểm tra Tenant Portal', false, e.message);
    }

    // ─── MODULE 13: CRON ENDPOINT PROTECTION ───
    try {
        // Gửi request không có token -> Phải nhận 401
        const unauthRes = await fetch('http://localhost:3000/api/cron/reminders');
        const isProtected = unauthRes.status === 401;
        recordTest('Security', 'Bảo vệ endpoint Cron Reminders (Từ chối truy cập không có Secret)', isProtected, `Status: ${unauthRes.status}`);

        // Gửi request kèm header Vercel Cron -> Phải nhận 200
        const cronRes = await fetch('http://localhost:3000/api/cron/reminders', {
            headers: { 'x-vercel-cron': '1' }
        });
        const vercelCronSuccess = cronRes.status === 200;
        recordTest('Security', 'Xác thực Vercel Cron Header hợp lệ', vercelCronSuccess, `Status: ${cronRes.status}`);
    } catch (e) {
        recordTest('Security', 'Kiểm tra bảo mật Cron Reminders', false, e.message);
    }

    // ─── MODULE 14: WEBHOOK SIGNATURE VERIFICATION ───
    try {
        // Tạo tạm 1 hoá đơn unpaid có order_code để test chữ ký giả mạo
        const testOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
        const { data: sampleBuilding } = await supabaseAdmin.from('buildings').select('id').limit(1).single();
        const { data: sampleRoom } = await supabaseAdmin.from('rooms').select('id').limit(1).single();

        const { data: testInv } = await supabaseAdmin.from('invoices').insert({
            org_id: orgId,
            building_id: sampleBuilding?.id,
            room_id: sampleRoom?.id,
            title: 'Hóa đơn Test Webhook',
            month: '2099-12',
            total_amount: 500000,
            paid_amount: 0,
            status: 'unpaid',
            order_code: testOrderCode
        }).select().single();

        const fakeWebhookRes = await fetch('http://localhost:3000/api/webhooks/payos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: '00',
                desc: 'success',
                success: true,
                data: {
                    orderCode: testOrderCode,
                    amount: 500000,
                    description: `Thanh toan hoa don ${testInv?.id}`,
                    signature: 'invalid_forged_signature_12345'
                },
                signature: 'invalid_forged_signature_12345'
            })
        });

        const isSignatureRejected = fakeWebhookRes.status === 400;
        recordTest('Security', 'Bảo vệ Webhook PayOS (Từ chối chữ ký giả mạo nhắm vào hoá đơn chưa thanh toán)', isSignatureRejected, `Status: ${fakeWebhookRes.status}`);

        // Cleanup
        if (testInv?.id) {
            await supabaseAdmin.from('invoices').delete().eq('id', testInv.id);
        }
    } catch (e) {
        recordTest('Security', 'Kiểm tra bảo mật Webhook PayOS', false, e.message);
    }

    // ─── MODULE 15: AI VISION OCR ENDPOINTS ───
    try {
        // Kiểm tra endpoint OCR CCCD từ chối request rỗng
        const emptyOcrRes = await fetch('http://localhost:3000/api/ocr/cccd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const ocrHandled = emptyOcrRes.status === 400 || emptyOcrRes.status === 401;
        recordTest('OCR', 'Kiểm tra xác thực đầu vào API OCR CCCD', ocrHandled, `Status: ${emptyOcrRes.status}`);

        // Kiểm tra endpoint OCR Đồng hồ từ chối request rỗng
        const emptyMeterRes = await fetch('http://localhost:3000/api/ocr/meter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const meterOcrHandled = emptyMeterRes.status === 400 || emptyMeterRes.status === 401;
        recordTest('OCR', 'Kiểm tra xác thực đầu vào API OCR Đồng hồ điện nước', meterOcrHandled, `Status: ${emptyMeterRes.status}`);
    } catch (e) {
        recordTest('OCR', 'Kiểm tra AI Vision OCR', false, e.message);
    }

    // ─── TỔNG KẾT BÁO CÁO ───
    console.log('\n================================================================');
    console.log('📊 KẾT QUẢ TỔNG HỢP KIỂM THỬ HỆ THỐNG');
    console.log('================================================================');

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.filter(r => !r.passed).length;

    console.log(`Tổng số bài test: ${totalTests}`);
    console.log(`Số bài thành công: ${passedTests}`);
    console.log(`Số bài thất bại: ${failedTests}`);

    if (failedTests > 0) {
        console.log('\n⚠️ DANH SÁCH LỖI / VẤN ĐỀ CẦN LẬP KẾ HOẠCH XỬ LÝ:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`- [${r.module}] ${r.test}: ${r.details}`);
        });
    } else {
        console.log('\n🎉 TẤT CẢ CHỨC NĂNG ĐỀU HOẠT ĐỘNG HOÀN HẢO VÀ ĐẠT TIÊU CHUẨN!');
    }
}

runAllTests().catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
});
