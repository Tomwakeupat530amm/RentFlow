'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSettingsData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single();

    return {
        profile,
        email: user.email,
    };
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;

    const { error } = await supabase
        .from('user_profiles')
        .update({
            full_name: fullName,
            phone: phone || null,
        })
        .eq('id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/settings');
    return { success: true };
}

export async function updateOrganization(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    // Check if user is owner
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id, role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'owner') return { error: 'Chỉ owner mới được chỉnh sửa tổ chức' };

    const orgName = formData.get('orgName') as string;

    const { error } = await supabase
        .from('organizations')
        .update({ name: orgName })
        .eq('id', profile.org_id!);

    if (error) return { error: error.message };

    revalidatePath('/settings');
    return { success: true };
}

export async function regenerateInviteCode() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id, role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'owner') return { error: 'Chỉ owner mới thực hiện được' };

    // Generate new invite code
    const newCode = Math.random().toString(36).substring(2, 10);

    const { error } = await supabase
        .from('organizations')
        .update({ invite_code: newCode })
        .eq('id', profile.org_id!);

    if (error) return { error: error.message };

    revalidatePath('/settings');
    return { success: true, newCode };
}

export async function getOrgMembers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [] };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return { data: [] };

    const { data: members } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, created_at')
        .eq('org_id', profile.org_id)
        .order('created_at');

    return { data: members || [] };
}
