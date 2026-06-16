'use server';

import { createClient } from '@/lib/supabase/server';

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
