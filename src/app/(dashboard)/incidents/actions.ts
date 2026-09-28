'use server';

import { createClient } from '@/lib/supabase/server';
import type { IncidentFormData, IncidentStatus } from '@/types/database';
import { revalidatePath } from 'next/cache';
import { getOrgId, requireAuthOrg } from '@/lib/rbac/guard';

export async function getIncidents() {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { data: null, error: 'Chưa đăng nhập' };

    const { data, error } = await supabase
        .from('incidents')
        .select(`
            *,
            room:rooms(id, name),
            building:buildings(id, name)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function createIncident(formData: IncidentFormData) {
    try {
        const { supabase, orgId, userId } = await requireAuthOrg();

        const { error } = await supabase
            .from('incidents')
            .insert({
                org_id: orgId,
                building_id: formData.building_id,
                room_id: formData.room_id || null,
                reporter_type: formData.reporter_type,
                reported_by: formData.reported_by || userId,
                title: formData.title,
                description: formData.description || null,
                status: formData.status || 'open',
                priority: formData.priority || 'medium',
                admin_notes: formData.admin_notes || null,
                image_urls: formData.image_urls || [],
            });

        if (error) return { error: error.message };

        revalidatePath('/incidents');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (err: unknown) {
        return { error: (err as Error).message || 'Lỗi xác thực người dùng.' };
    }
}

export async function updateIncident(id: string, formData: IncidentFormData) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Chưa đăng nhập' };

    const { error } = await supabase
        .from('incidents')
        .update({
            building_id: formData.building_id,
            room_id: formData.room_id || null,
            reporter_type: formData.reporter_type,
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            admin_notes: formData.admin_notes || null,
            image_urls: formData.image_urls || [],
        })
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) return { error: error.message };

    revalidatePath('/incidents');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteIncident(id: string) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Chưa đăng nhập' };

    const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) return { error: error.message };

    revalidatePath('/incidents');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateIncidentStatus(id: string, status: IncidentStatus) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Chưa đăng nhập' };

    const { error } = await supabase
        .from('incidents')
        .update({ status })
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) return { error: error.message };

    revalidatePath('/incidents');
    revalidatePath('/dashboard');
    return { success: true };
}
