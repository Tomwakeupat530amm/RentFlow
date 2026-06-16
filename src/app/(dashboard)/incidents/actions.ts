'use server';

import { createClient } from '@/lib/supabase/server';
import type { IncidentFormData, IncidentStatus } from '@/types/database';
import { revalidatePath } from 'next/cache';

// Helper: get current user's org_id
async function getOrgId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    return profile?.org_id || null;
}

export async function getIncidents() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('incidents')
        .select(`
            *,
            room:rooms(id, name),
            building:buildings(id, name)
        `)
        .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function createIncident(formData: IncidentFormData) {
    const supabase = await createClient();
    const orgId = await getOrgId();

    // Also get the current user ID for the reporter field
    const { data: { user } } = await supabase.auth.getUser();

    if (!orgId) return { error: 'Không tìm thấy tổ chức. Vui lòng đăng nhập lại.' };

    const { error } = await supabase
        .from('incidents')
        .insert({
            org_id: orgId,
            building_id: formData.building_id,
            room_id: formData.room_id || null,
            reporter_type: formData.reporter_type,
            reported_by: formData.reported_by || user?.id,
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
}

export async function updateIncident(id: string, formData: IncidentFormData) {
    const supabase = await createClient();

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
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/incidents');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteIncident(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/incidents');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateIncidentStatus(id: string, status: IncidentStatus) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('incidents')
        .update({ status })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/incidents');
    revalidatePath('/dashboard');
    return { success: true };
}
