'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAllRooms() {
    const supabase = await createClient();

    // Get user's org_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập', data: [] };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return { error: 'Chưa thuộc tổ chức', data: [] };

    // Get all buildings for org
    const { data: buildings } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('org_id', profile.org_id)
        .is('deleted_at', null);

    if (!buildings || buildings.length === 0) return { data: [] };

    const buildingIds = buildings.map(b => b.id);
    const buildingMap = Object.fromEntries(buildings.map(b => [b.id, b.name]));

    // Get all rooms
    const { data: rooms, error } = await supabase
        .from('rooms')
        .select('*')
        .in('building_id', buildingIds)
        .is('deleted_at', null)
        .order('building_id')
        .order('floor')
        .order('name');

    if (error) return { error: error.message, data: [] };

    const enriched = rooms?.map(r => ({
        ...r,
        building_name: buildingMap[r.building_id] || '',
    })) || [];

    return { data: enriched };
}
