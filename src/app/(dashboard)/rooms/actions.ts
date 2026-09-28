'use server';

import { requireAuthOrg } from '@/lib/rbac/guard';

export async function getAllRooms() {
    const auth = await requireAuthOrg().catch(() => null);
    if (!auth) return { error: 'Chưa đăng nhập', data: [] };
    const { supabase, orgId } = auth;

    // Get all buildings for org
    const { data: buildings } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('org_id', orgId)
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
