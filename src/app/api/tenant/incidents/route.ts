import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantSession } from '@/lib/tenant-auth';

export async function POST(request: Request) {
    try {
        const session = await getTenantSession();
        if (!session || !session.room_id) {
            return NextResponse.json({ error: 'Không được phép' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description } = body;

        if (!title || !description) {
            return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get room details to find org_id and building_id
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('building_id, buildings(org_id)')
            .eq('id', session.room_id)
            .single();

        if (roomError || !room || !room.buildings) {
            return NextResponse.json({ error: 'Không tìm thấy thông tin phòng' }, { status: 404 });
        }

        const { error } = await supabase
            .from('incidents')
            .insert({
                title,
                description,
                room_id: session.room_id,
                org_id: (room.buildings as unknown as { org_id: string }).org_id,
                building_id: room.building_id,
                reporter_type: 'tenant',
                reported_by: session.id,
                status: 'open',
            });

        if (error) {
            console.error('Insert incident error:', error);
            return NextResponse.json({ error: 'Đã có lỗi xảy ra. Không thể báo sự cố.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
