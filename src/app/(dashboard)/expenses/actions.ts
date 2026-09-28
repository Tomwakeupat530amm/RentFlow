'use server';

import { createClient } from '@/lib/supabase/server';
import { ExpenseFormData } from '@/types/database';
import dayjs from 'dayjs';
import { getOrgId } from '@/lib/rbac/guard';

export async function getExpenses(filters?: { category?: string; building_id?: string; month?: string }) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { data: null, error: 'Chưa đăng nhập' };

    let query = supabase
        .from('expenses')
        .select('*, building:buildings(name)')
        .eq('org_id', orgId)
        .order('date', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
    }
    if (filters?.building_id && filters.building_id !== 'all') {
        query = query.eq('building_id', filters.building_id);
    }
    if (filters?.month) {
        const startDate = dayjs(filters.month).startOf('month').format('YYYY-MM-DD');
        const endDate = dayjs(filters.month).add(1, 'month').startOf('month').format('YYYY-MM-DD');
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
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Không tìm thấy tổ chức' };

    const { data, error } = await supabase
        .from('expenses')
        .update(formData)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) return { error: error.message };
    return { data, error: null };
}

export async function deleteExpense(id: string) {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Không tìm thấy tổ chức' };

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) return { error: error.message };
    return { success: true };
}
