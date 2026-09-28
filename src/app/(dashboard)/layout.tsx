import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/server';
import { getOrgPlan, getOrgUsage } from '@/lib/subscription/actions';
import { getPendingActionCounts } from '@/lib/dashboard/pending-actions';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const [{ data: { user } }, { planType }, usage, pendingCounts] = await Promise.all([
        supabase.auth.getUser(),
        getOrgPlan(),
        getOrgUsage(),
        getPendingActionCounts(),
    ]);

    let profile = { full_name: 'User', role: 'member' };
    if (user) {
        const { data } = await supabase
            .from('user_profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();
        if (data) {
            profile = data;
        }
    }

    return (
        <MainLayout
            userId={user?.id || ''}
            userName={profile.full_name || 'User'}
            userRole={profile.role || 'member'}
            planType={planType}
            roomCount={usage.room_count}
            pendingCounts={pendingCounts}
        >
            {children}
        </MainLayout>
    );
}
