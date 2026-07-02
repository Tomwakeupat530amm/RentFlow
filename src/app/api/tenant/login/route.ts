import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setTenantSession } from '@/lib/tenant-auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, access_code } = body;

        if (!phone || !access_code) {
            return NextResponse.json(
                { error: 'Vui lòng nhập số điện thoại và mã PIN' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Find tenant by phone and access_code
        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, full_name, phone, access_code, room_id')
            .eq('phone', phone)
            .eq('access_code', access_code)
            .eq('is_active', true)
            .single();

        if (error || !tenant) {
            return NextResponse.json(
                { error: 'Số điện thoại hoặc mã PIN không chính xác, hoặc khách thuê không còn hoạt động' },
                { status: 401 }
            );
        }

        // Set JWT session
        await setTenantSession({
            id: tenant.id,
            name: tenant.full_name,
            phone: tenant.phone,
            room_id: tenant.room_id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Tenant login error:', error);
        return NextResponse.json(
            { error: 'Đã có lỗi xảy ra. Vui lòng thử lại' },
            { status: 500 }
        );
    }
}
