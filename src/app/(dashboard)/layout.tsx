import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { requireAuthOrg } from '@/lib/rbac/guard';
import { getOrgPlan, getOrgUsage } from '@/lib/subscription/actions';
import { getPendingActionCounts } from '@/lib/dashboard/pending-actions';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [auth, { planType }, usage, pendingCounts] = await Promise.all([
        requireAuthOrg().catch(() => null),
        getOrgPlan(),
        getOrgUsage(),
        getPendingActionCounts(),
    ]);

    return (
        <MainLayout
            userId={auth?.userId || ''}
            userName={auth?.fullName || 'User'}
            userRole={auth?.role || 'member'}
            planType={planType}
            roomCount={usage.room_count}
            pendingCounts={pendingCounts}
        >
            {children}
        </MainLayout>
    );
}
