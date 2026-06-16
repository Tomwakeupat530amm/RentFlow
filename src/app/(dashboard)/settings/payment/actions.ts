'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PaymentSettingsFormData } from '@/types/database';

export async function getPaymentSettings() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) return null;

        const { data: settings } = await supabase
            .from('payment_settings')
            .select('*')
            .eq('org_id', profile.org_id)
            .single();

        return settings;
    } catch (error) {
        console.error('Error getting payment settings:', error);
        return null;
    }
}

export async function updatePaymentSettings(data: PaymentSettingsFormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) return { error: 'Organization not found' };
        if (profile.role !== 'owner') return { error: 'Only owners can manage payment settings' };

        // Check if exists
        const { data: existing } = await supabase
            .from('payment_settings')
            .select('id')
            .eq('org_id', profile.org_id)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('payment_settings')
                .update({
                    bank_name: data.bank_name,
                    bank_bin: data.bank_bin,
                    bank_account: data.bank_account,
                    account_name: data.account_name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('payment_settings')
                .insert({
                    org_id: profile.org_id,
                    bank_name: data.bank_name,
                    bank_bin: data.bank_bin,
                    bank_account: data.bank_account,
                    account_name: data.account_name
                });

            if (error) throw error;
        }

        revalidatePath('/settings/payment');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error updating payment settings:', error);
        return { error: error instanceof Error ? error.message : 'Lỗi hệ thống' };
    }
}
