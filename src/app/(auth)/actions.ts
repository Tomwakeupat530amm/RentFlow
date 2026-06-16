'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

// ─── LOGIN ───

export async function loginWithEmail(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        if (error.message.includes('Email not confirmed')) {
            return { error: 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư và nhấn link xác nhận.' };
        }
        if (error.message.includes('Invalid login credentials')) {
            return { error: 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.' };
        }
        return { error: error.message };
    }

    return { success: true };
}

// ─── REGISTER + CREATE ORG ───

export async function registerAndCreateOrg(formData: FormData) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const orgName = formData.get('orgName') as string;

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (signUpError) {
        return { error: signUpError.message };
    }

    if (!authData.user) {
        return { error: 'Không thể tạo tài khoản. Vui lòng thử lại.' };
    }

    const { data: org, error: orgError } = await adminClient
        .from('organizations')
        .insert({ name: orgName })
        .select()
        .single();

    if (orgError) {
        return { error: `Lỗi tạo tổ chức: ${orgError.message}` };
    }

    const { error: profileError } = await adminClient
        .from('user_profiles')
        .update({
            org_id: org.id,
            role: 'owner',
            full_name: fullName,
        })
        .eq('id', authData.user.id);

    if (profileError) {
        return { error: `Lỗi cập nhật hồ sơ: ${profileError.message}` };
    }

    return {
        success: true,
        orgName: org.name,
        message: 'Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.',
    };
}

// ─── REGISTER + JOIN ORG BY INVITE CODE ───

export async function registerAndJoinOrg(formData: FormData) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const inviteCode = formData.get('inviteCode') as string;

    const { data: org, error: orgLookupError } = await adminClient
        .from('organizations')
        .select('id, name')
        .eq('invite_code', inviteCode.trim().toLowerCase())
        .single();

    if (orgLookupError || !org) {
        return { error: 'Mã mời không hợp lệ. Vui lòng kiểm tra lại.' };
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (signUpError) {
        return { error: signUpError.message };
    }

    if (!authData.user) {
        return { error: 'Không thể tạo tài khoản. Vui lòng thử lại.' };
    }

    const { error: profileError } = await adminClient
        .from('user_profiles')
        .update({
            org_id: org.id,
            role: 'member',
            full_name: fullName,
        })
        .eq('id', authData.user.id);

    if (profileError) {
        return { error: `Lỗi tham gia tổ chức: ${profileError.message}` };
    }

    return { success: true, orgName: org.name };
}

// ─── LOGOUT ───

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}

// ─── GOOGLE OAUTH ───

export async function loginWithGoogle() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data.url) {
        redirect(data.url);
    }
}
