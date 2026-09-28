import { createClient } from '@/lib/supabase/server';

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface GuardAuthResult {
    supabase: SupabaseServerClient;
    userId: string;
    orgId: string;
    role: string;
    fullName?: string;
}

/**
 * Lấy ID tổ chức của người dùng hiện tại (trả về null nếu chưa đăng nhập)
 */
export async function getOrgId(): Promise<string | null> {
    try {
        const auth = await requireAuthOrg();
        return auth.orgId;
    } catch {
        return null;
    }
}

/**
 * Lấy thông tin tổ chức và người dùng đã xác thực (Defense-in-Depth)
 */
export async function requireAuthOrg(): Promise<GuardAuthResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.');
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id, role, full_name')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) {
        throw new Error('Tài khoản chưa được liên kết với tổ chức nào.');
    }

    return {
        supabase,
        userId: user.id,
        orgId: profile.org_id,
        role: profile.role || 'member',
        fullName: profile.full_name || undefined,
    };
}

/**
 * Kiểm tra quyền hạn của người dùng trước khi thực thi Server Action
 * - Chủ sở hữu (owner) luôn có toàn quyền
 * - Các vai trò khác đối soát với bảng role_permissions
 */
export async function requirePermission(permission: string): Promise<GuardAuthResult> {
    const auth = await requireAuthOrg();

    // Owner có mọi quyền
    if (auth.role === 'owner') {
        return auth;
    }

    const { data: perm } = await auth.supabase
        .from('role_permissions')
        .select('id')
        .eq('role', auth.role)
        .eq('permission', permission)
        .maybeSingle();

    if (!perm) {
        throw new Error(`Bạn không có quyền thực hiện tác vụ này (${permission}).`);
    }

    return auth;
}
