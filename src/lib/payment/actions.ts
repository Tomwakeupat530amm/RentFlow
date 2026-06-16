'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── GET BANK CONFIG ───

export async function getBankConfig() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return { error: 'Chưa thuộc tổ chức nào' };

    const { data: org, error } = await supabase
        .from('organizations')
        .select('bank_name, bank_account_number, bank_account_name, bank_bin')
        .eq('id', profile.org_id)
        .single();

    if (error) return { error: error.message };
    return { data: org };
}

// ─── UPDATE BANK CONFIG ───

export async function updateBankConfig(data: {
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
    bank_bin: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id, role')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return { error: 'Chưa thuộc tổ chức nào' };
    if (profile.role !== 'owner') return { error: 'Chỉ chủ sở hữu mới có thể cập nhật' };

    const { error } = await supabase
        .from('organizations')
        .update({
            bank_name: data.bank_name,
            bank_account_number: data.bank_account_number,
            bank_account_name: data.bank_account_name,
            bank_bin: data.bank_bin,
        })
        .eq('id', profile.org_id);

    if (error) return { error: error.message };

    revalidatePath('/settings');
    return { success: true };
}

// ─── SIGN CONTRACT ───

export async function signContract(contractId: string, role: 'owner' | 'tenant') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    const updateData = role === 'owner'
        ? { signed_by_owner: true, owner_signed_at: new Date().toISOString() }
        : { signed_by_tenant: true, tenant_signed_at: new Date().toISOString() };

    const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId);

    if (error) return { error: error.message };

    revalidatePath('/contracts');
    return { success: true };
}

// ─── GET BANK TRANSACTIONS ───

export async function getBankTransactions(invoiceId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập', data: [] };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return { error: 'Chưa thuộc tổ chức nào', data: [] };

    let query = supabase
        .from('bank_transactions')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

    if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message, data: [] };
    return { data: data || [] };
}

// ─── MANUAL MATCH TRANSACTION ───

export async function matchTransaction(transactionId: string, invoiceId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('bank_transactions')
        .update({
            invoice_id: invoiceId,
            status: 'matched',
            matched_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

    if (error) return { error: error.message };

    // Also mark invoice as paid
    await supabase
        .from('invoices')
        .update({ status: 'paid', paid_date: new Date().toISOString() })
        .eq('id', invoiceId);

    revalidatePath('/invoices');
    return { success: true };
}
