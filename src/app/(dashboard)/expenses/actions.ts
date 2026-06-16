'use server';

import { createClient } from '@/lib/supabase/server';
import { ExpenseFormData } from '@/types/database';

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

export async function getExpenses(filters?: { category?: string; building_id?: string; month?: string }) {
    const supabase = await createClient();

    let query = supabase
        .from('expenses')
        .select('*, building:buildings(name)')
        .order('date', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
    }
    if (filters?.building_id && filters.building_id !== 'all') {
        query = query.eq('building_id', filters.building_id);
    }
    if (filters?.month) {
        // e.g. filters.month = '2023-10'
        const startDate = `${filters.month}-01`;
        const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0];
        query = query.gte('date', startDate).lt('date', endDate);
    }

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function createExpense(formData: ExpenseFormData) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Không tìm thấy tổ chức' };

    const { data, error } = await supabase
        .from('expenses')
        .insert({
            org_id: orgId,
            ...formData,
        })
        .select()
        .single();

    if (error) return { error: error.message };
    return { data, error: null };
}

export async function updateExpense(id: string, formData: Partial<ExpenseFormData>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('expenses')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

    if (error) return { error: error.message };
    return { data, error: null };
}

export async function deleteExpense(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) return { error: error.message };
    return { success: true };
}
