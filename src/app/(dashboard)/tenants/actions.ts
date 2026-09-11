'use server';

import { createClient } from '@/lib/supabase/server';
import type { TenantFormData } from '@/types/database';

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

export async function getTenants() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function getTenantById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

function generatePinCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createTenant(formData: TenantFormData) {
    const supabase = await createClient();
    const orgId = await getOrgId();

    if (!orgId) return { error: 'Không tìm thấy tổ chức. Vui lòng đăng nhập lại.' };

    const pin = generatePinCode();

    const { error } = await supabase
        .from('tenants')
        .insert({
            org_id: orgId,
            full_name: formData.full_name,
            phone: formData.phone || null,
            email: formData.email || null,
            id_number: formData.id_number || null,
            id_image_url: formData.id_image_url || null,
            date_of_birth: formData.date_of_birth || null,
            permanent_address: formData.permanent_address || null,
            notes: formData.notes || null,
            access_code: pin,
        });

    if (error) return { error: error.message };
    return { success: true };
}

export async function regenerateTenantPin(id: string) {
    const supabase = await createClient();
    const newPin = generatePinCode();

    const { error } = await supabase
        .from('tenants')
        .update({ access_code: newPin })
        .eq('id', id);

    if (error) return { error: error.message };
    return { success: true, pin: newPin };
}

export async function updateTenant(id: string, formData: TenantFormData) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tenants')
        .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            email: formData.email || null,
            id_number: formData.id_number || null,
            id_image_url: formData.id_image_url || null,
            date_of_birth: formData.date_of_birth || null,
            permanent_address: formData.permanent_address || null,
            notes: formData.notes || null,
        })
        .eq('id', id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function deleteTenant(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tenants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function toggleTenantActive(id: string, isActive: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tenants')
        .update({ is_active: isActive })
        .eq('id', id);

    if (error) return { error: error.message };
    return { success: true };
}
