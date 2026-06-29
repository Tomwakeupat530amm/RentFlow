'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { BuildingFormData } from '@/types/database';
import { canAddBuilding } from '@/lib/subscription/actions';

export type ActionResponse<T = unknown> = {
    success?: boolean;
    error?: string;
    requiresUpgrade?: boolean;
    featureName?: string;
    data?: T;
};

// ─── GET USER ORG_ID (helper) ───

async function getUserOrgId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Chưa đăng nhập');

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) throw new Error('Chưa thuộc tổ chức nào');
    return { supabase, orgId: profile.org_id, userId: user.id };
}

// ─── LIST BUILDINGS ───

export async function getBuildings() {
    const { supabase, orgId } = await getUserOrgId();

    const { data: buildings, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) return { error: error.message, data: [] };

    // Get room counts per building
    const buildingIds = buildings?.map(b => b.id) || [];

    if (buildingIds.length === 0) {
        return { data: buildings || [] };
    }

    const { data: rooms } = await supabase
        .from('rooms')
        .select('building_id, status')
        .in('building_id', buildingIds);

    // Aggregate room counts
    const countMap: Record<string, { total: number; occupied: number; vacant: number }> = {};
    rooms?.forEach(room => {
        if (!countMap[room.building_id]) {
            countMap[room.building_id] = { total: 0, occupied: 0, vacant: 0 };
        }
        countMap[room.building_id].total++;
        if (room.status === 'occupied') countMap[room.building_id].occupied++;
        if (room.status === 'vacant') countMap[room.building_id].vacant++;
    });

    const enriched = buildings?.map(b => ({
        ...b,
        room_count: countMap[b.id]?.total || 0,
        occupied_count: countMap[b.id]?.occupied || 0,
        vacant_count: countMap[b.id]?.vacant || 0,
    })) || [];

    return { data: enriched };
}

// ─── CREATE BUILDING ───

export async function createBuilding(formData: BuildingFormData): Promise<ActionResponse> {
    // Check free tier limit
    const buildingCheck = await canAddBuilding();
    if (!buildingCheck.allowed) {
        return {
            error: `Gói Free chỉ cho phép tối đa ${buildingCheck.limit} tòa nhà. Nâng cấp Premium để không giới hạn!`,
            requiresUpgrade: true,
            featureName: 'Không giới hạn tòa nhà'
        };
    }

    const { supabase, orgId } = await getUserOrgId();

    const { error } = await supabase
        .from('buildings')
        .insert({
            org_id: orgId,
            name: formData.name,
            address: formData.address || null,
            num_floors: formData.num_floors,
            description: formData.description || null,
            status: formData.status,
        });

    if (error) return { error: error.message };

    revalidatePath('/buildings');
    return { success: true };
}

// ─── UPDATE BUILDING ───

export async function updateBuilding(id: string, formData: BuildingFormData): Promise<ActionResponse> {
    const { supabase } = await getUserOrgId();

    const { error } = await supabase
        .from('buildings')
        .update({
            name: formData.name,
            address: formData.address || null,
            num_floors: formData.num_floors,
            description: formData.description || null,
            status: formData.status,
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/buildings');
    return { success: true };
}

// ─── DELETE BUILDING ───

export async function deleteBuilding(id: string) {
    const { supabase } = await getUserOrgId();

    const { error } = await supabase
        .from('buildings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/buildings');
    return { success: true };
}
