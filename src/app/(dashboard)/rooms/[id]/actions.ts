'use server';

import { createClient } from '@/lib/supabase/server';
import { getOrgId } from '@/lib/rbac/guard';

export async function getRoomInfo(roomId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('rooms')
        .select(`
            *,
            building:buildings(id, name, address)
        `)
        .eq('id', roomId)
        .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function getRoomContracts(roomId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contracts')
        .select(`
            *,
            tenant:tenants(*),
            roommates:roommates(*)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
}

export async function getRoomMeterHistory(roomId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('meter_records')
        .select('*')
        .eq('room_id', roomId)
        .order('record_month', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
}


export async function switchRoomModel(roomId: string, currentType: 'long_term' | 'short_term') {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Chưa đăng nhập' };

    // Kiểm tra phòng thuộc tổ chức quản lý (Defense-in-Depth)
    const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('id, building:buildings!inner(org_id)')
        .eq('id', roomId)
        .eq('buildings.org_id', orgId)
        .single();

    if (roomErr || !room) {
        return { error: 'Không tìm thấy phòng hoặc bạn không có quyền thao tác trên phòng này.' };
    }
    
    if (currentType === 'long_term') {
        // Check for active contracts
        const { data: activeContracts, error: contractErr } = await supabase
            .from('contracts')
            .select('id')
            .eq('room_id', roomId)
            .eq('status', 'active');
            
        if (contractErr) return { error: contractErr.message };
        if (activeContracts && activeContracts.length > 0) {
            return { error: 'Không thể chuyển đổi: Phòng đang có hợp đồng thuê dài hạn còn hiệu lực. Vui lòng thanh lý hợp đồng trước.' };
        }
    } else {
        // Check for future short-term bookings
        const today = new Date().toISOString();
        const { data: upcomingBookings, error: bookingErr } = await supabase
            .from('bookings')
            .select('id')
            .eq('room_id', roomId)
            .in('status', ['confirmed', 'pending'])
            .gte('check_out_date', today);
            
        if (bookingErr) return { error: bookingErr.message };
        if (upcomingBookings && upcomingBookings.length > 0) {
            return { error: 'Không thể chuyển đổi: Phòng đang có lịch đặt (booking) homestay trong tương lai chưa hoàn tất.' };
        }
    }

    const newType = currentType === 'long_term' ? 'short_term' : 'long_term';
    const { error: updateErr } = await supabase
        .from('rooms')
        .update({ rental_type: newType })
        .eq('id', roomId);

    if (updateErr) return { error: updateErr.message };
    return { error: null };
}
