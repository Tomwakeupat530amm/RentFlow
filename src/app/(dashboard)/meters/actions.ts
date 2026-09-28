'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';
import { requireAuthOrg } from '@/lib/rbac/guard';

export async function getBuildingsForMeters() {
    const auth = await requireAuthOrg().catch(() => null);
    if (!auth) return { data: [], error: 'Not authenticated' };
    const { supabase, orgId } = auth;

    const [{ data: org }, { data, error }] = await Promise.all([
        supabase
            .from('organizations')
            .select('plan_type')
            .eq('id', orgId)
            .single(),
        supabase
            .from('buildings')
            .select('id, name')
            .eq('org_id', orgId)
            .eq('status', 'active')
            .is('deleted_at', null),
    ]);

    const isPremium = org?.plan_type === 'premium';

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

    if (!rooms || rooms.length === 0) return { data: [], error: rooms ? null : 'Không thể tải phòng' };

    const roomIds = rooms.map(r => r.id);

    // 2. Lấy danh sách record tháng hiện tại (monthStr) chỉ cho các phòng thuộc toà nhà
    const { data: currentRecords } = await supabase
        .from('meter_records')
        .select('*')
        .eq('period', monthStr)
        .in('room_id', roomIds);

    // 3. Tính tháng trước bằng dayjs (chống lỗi ngày 31 rollover)
    const isIsoDate = monthStr.length > 7;
    const prevMonthStr = dayjs(monthStr).subtract(1, 'month').format(isIsoDate ? 'YYYY-MM-DD' : 'YYYY-MM');

    const { data: prevRecords } = await supabase
        .from('meter_records')
        .select('*')
        .eq('period', prevMonthStr)
        .in('room_id', roomIds);

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
