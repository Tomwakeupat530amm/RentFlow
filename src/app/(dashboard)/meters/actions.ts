'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getBuildingsForMeters() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return { data: [], error: 'Không tìm thấy tổ chức' };

    const { data: org } = await supabase
        .from('organizations')
        .select('plan_type')
        .eq('id', profile.org_id)
        .single();

    const isPremium = org?.plan_type === 'premium';

    const { data, error } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('org_id', profile.org_id)
        .eq('status', 'active')
        .is('deleted_at', null);

    return { data: data || [], isPremium, error: error?.message };
}

export async function getMeterRecords(buildingId: string, monthStr: string) {
    const supabase = await createClient();

    // 1. Fetch Rooms
    const { data: rooms } = await supabase
        .from('rooms')
        .select('id, name, status, floor')
        .eq('building_id', buildingId)
        .is('deleted_at', null)
        .order('floor')
        .order('name');

    if (!rooms) return { data: [], error: 'Không thể tải phòng' };

    // 2. Lấy danh sách record tháng hiện tại (monthStr)
    const { data: currentRecords } = await supabase
        .from('meter_records')
        .select('*')
        .eq('record_month', monthStr);

    // 3. Tính tháng trước (ví dụ 2026-02-01 -> 2026-01-01)
    const dateObj = new Date(monthStr);
    dateObj.setMonth(dateObj.getMonth() - 1);
    const prevMonthStr = dateObj.toISOString().split('T')[0];

    const { data: prevRecords } = await supabase
        .from('meter_records')
        .select('*')
        .eq('record_month', prevMonthStr);

    const prevMap = Object.fromEntries((prevRecords || []).map(r => [r.room_id, r]));
    const currentMap = Object.fromEntries((currentRecords || []).map(r => [r.room_id, r]));

    // 4. Merge data
    const data = rooms.map(room => {
        const cur = currentMap[room.id];
        const prev = prevMap[room.id];
        return {
            room_id: room.id,
            room_name: room.name,
            floor: room.floor,
            status: room.status,
            electricity_old: cur?.electricity_old ?? prev?.electricity_new ?? 0,
            electricity_new: cur?.electricity_new ?? 0,
            electricity_usage: cur?.electricity_usage ?? 0,
            water_old: cur?.water_old ?? prev?.water_new ?? 0,
            water_new: cur?.water_new ?? 0,
            water_usage: cur?.water_usage ?? 0,
            id: cur?.id,
            notes: cur?.notes || '',
        };
    });

    return { data, error: null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertMeterRecords(monthStr: string, records: any[]) {
    const supabase = await createClient();

    const insertData = records.map(r => {
        // Only get exactly the fields needed by the database schema
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item: any = {
            room_id: r.room_id,
            record_month: monthStr,
            electricity_old: r.electricity_old,
            electricity_new: r.electricity_new,
            electricity_usage: r.electricity_usage,
            water_old: r.water_old,
            water_new: r.water_new,
            water_usage: r.water_usage,
            notes: r.notes || null,
        };
        if (r.id) item.id = r.id; // required for upsert to know which record to update
        return item;
    });

    if (insertData.length > 0) {
        // Chú ý: trong file DB có defined ON CONFLICT
        const { error } = await supabase
            .from('meter_records')
            .upsert(insertData, { onConflict: 'room_id, record_month' });

        if (error) return { error: error.message };
    }

    revalidatePath('/meters');
    revalidatePath('/dashboard');
    return { success: true };
}
