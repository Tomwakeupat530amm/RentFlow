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
        .eq('period', monthStr);

    // 3. Tính tháng trước (ví dụ 2026-02-01 -> 2026-01-01)
    const dateObj = new Date(monthStr);
    dateObj.setMonth(dateObj.getMonth() - 1);
    const prevMonthStr = dateObj.toISOString().split('T')[0];

    const { data: prevRecords } = await supabase
        .from('meter_records')
        .select('*')
        .eq('period', prevMonthStr);

    // Group by room_id -> service_type -> record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevMap = (prevRecords || []).reduce((acc: any, r: any) => {
        if (!acc[r.room_id]) acc[r.room_id] = {};
        acc[r.room_id][r.service_type] = r;
        return acc;
    }, {});
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMap = (currentRecords || []).reduce((acc: any, r: any) => {
        if (!acc[r.room_id]) acc[r.room_id] = {};
        acc[r.room_id][r.service_type] = r;
        return acc;
    }, {});

    // 4. Merge data
    const data = rooms.map(room => {
        const curElec = currentMap[room.id]?.electricity;
        const prevElec = prevMap[room.id]?.electricity;
        const curWater = currentMap[room.id]?.water;
        const prevWater = prevMap[room.id]?.water;
        
        return {
            room_id: room.id,
            room_name: room.name,
            floor: room.floor,
            status: room.status,
            electricity_old: curElec?.old_reading ?? prevElec?.new_reading ?? 0,
            electricity_new: curElec?.new_reading ?? 0,
            electricity_usage: curElec?.usage ?? 0,
            water_old: curWater?.old_reading ?? prevWater?.new_reading ?? 0,
            water_new: curWater?.new_reading ?? 0,
            water_usage: curWater?.usage ?? 0,
            id: curElec?.id || curWater?.id, // Optional, UI might use it
            notes: curElec?.notes || curWater?.notes || '',
        };
    });

    return { data, error: null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertMeterRecords(monthStr: string, records: any[]) {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any[] = [];
    
    records.forEach(r => {
        // Push Electricity record
        insertData.push({
            room_id: r.room_id,
            period: monthStr,
            service_type: 'electricity',
            old_reading: r.electricity_old,
            new_reading: r.electricity_new
            // usage is a GENERATED column, do not pass
        });
        
        // Push Water record
        insertData.push({
            room_id: r.room_id,
            period: monthStr,
            service_type: 'water',
            old_reading: r.water_old,
            new_reading: r.water_new
            // usage is a GENERATED column, do not pass
        });
    });

    if (insertData.length > 0) {
        // Chú ý: ON CONFLICT phải khớp với constraint
        const { error } = await supabase
            .from('meter_records')
            .upsert(insertData, { onConflict: 'room_id, period, service_type' });

        if (error) return { error: error.message };
    }

    revalidatePath('/meters');
    revalidatePath('/dashboard');
    return { success: true };
}
