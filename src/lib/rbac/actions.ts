'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type UserRole = 'owner' | 'member' | 'accountant' | 'guard' | 'viewer';

export const ROLE_LABELS: Record<UserRole, string> = {
    owner: 'Chủ sở hữu',
    member: 'Thành viên',
    accountant: 'Kế toán',
    guard: 'Bảo vệ',
    viewer: 'Chỉ xem',
};

export const ROLE_COLORS: Record<UserRole, string> = {
    owner: 'gold',
    member: 'blue',
    accountant: 'green',
    guard: 'orange',
    viewer: 'default',
};

// ─── CHECK PERMISSION ───

export async function checkPermission(permission: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) return false;

    // Owner has all permissions
    if (profile.role === 'owner') return true;

    const { data: perm } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role', profile.role)
        .eq('permission', permission)
        .single();

    return !!perm;
}

// ─── GET ROLE PERMISSIONS ───

export async function getRolePermissions(role: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', role);

    if (error) return [];
    return data?.map(p => p.permission) || [];
}

// ─── UPDATE MEMBER ROLE ───

export async function updateMemberRole(memberId: string, newRole: UserRole) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    // Only owner can change roles
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, org_id')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'owner') return { error: 'Chỉ chủ sở hữu mới có thể thay đổi vai trò' };

    // Cannot change own role
    if (memberId === user.id) return { error: 'Không thể thay đổi vai trò của chính mình' };

    // Cannot set another owner
    if (newRole === 'owner') return { error: 'Không thể đặt thêm chủ sở hữu' };

    const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('org_id', profile.org_id);

    if (error) return { error: error.message };

    revalidatePath('/settings');
    return { success: true };
}

// ─── REMOVE MEMBER ───

export async function removeMember(memberId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, org_id')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'owner') return { error: 'Chỉ chủ sở hữu mới có thể xoá thành viên' };
    if (memberId === user.id) return { error: 'Không thể xoá chính mình' };

    const { error } = await supabase
        .from('user_profiles')
        .update({ org_id: null, role: 'member' })
        .eq('id', memberId)
        .eq('org_id', profile.org_id);

    if (error) return { error: error.message };

    revalidatePath('/settings');
    return { success: true };
}
