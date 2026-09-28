'use server';

import dayjs from 'dayjs';
import { requireAuthOrg } from '@/lib/rbac/guard';
import { getPendingActionCounts } from '@/lib/dashboard/pending-actions';

export async function getDashboardStats() {
    const auth = await requireAuthOrg().catch(() => null);
    if (!auth) return null;
    const { supabase, orgId, fullName, role } = auth;

    // Fetch pending action counts in parallel
    const pendingCountsPromise = getPendingActionCounts();

    // Get all buildings for this org
    const { data: buildings } = await supabase
        .from('buildings')
        .select('id')
        .eq('org_id', orgId)
        .is('deleted_at', null);

    const buildingIds = buildings?.map(b => b.id) || [];
    const buildingCount = buildingIds.length;

    const roomStats = { total: 0, occupied: 0, vacant: 0, maintenance: 0 };

    if (buildingIds.length > 0) {
        const { data: rooms } = await supabase
            .from('rooms')
            .select('status')
            .in('building_id', buildingIds)
            .is('deleted_at', null);

        rooms?.forEach(r => {
            roomStats.total++;
            if (r.status === 'occupied') roomStats.occupied++;
            if (r.status === 'vacant') roomStats.vacant++;
            if (r.status === 'maintenance') roomStats.maintenance++;
        });
    }

    // Financial Stats
    const currentMonth = dayjs().format('YYYY-MM');
    let totalRevenue = 0;
    let totalCollectedThisMonth = 0;
    let totalDebt = 0;
    let totalExpenses = 0;

    // Generate last 6 months list safely using dayjs
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
        return dayjs().subtract(i, 'month').format('YYYY-MM');
    }).reverse();

    const monthlyRevenueMap: Record<string, { month: string, revenue: number, collected: number, expenses: number, profit: number }> = {};
    last6Months.forEach(m => {
        monthlyRevenueMap[m] = { month: m, revenue: 0, collected: 0, expenses: 0, profit: 0 };
    });

    if (buildingIds.length > 0) {
        const { data: invoices } = await supabase
            .from('invoices')
            .select('month, status, total_amount, paid_amount')
            .eq('org_id', orgId)
            .in('month', last6Months);

        invoices?.forEach(inv => {
            if (inv.status !== 'paid') {
                totalDebt += (Number(inv.total_amount) - Number(inv.paid_amount));
            }
            if (inv.month === currentMonth) {
                totalRevenue += Number(inv.total_amount);
                totalCollectedThisMonth += Number(inv.paid_amount);
            }
            if (monthlyRevenueMap[inv.month]) {
                monthlyRevenueMap[inv.month].revenue += Number(inv.total_amount);
                monthlyRevenueMap[inv.month].collected += Number(inv.paid_amount);
            }
        });
    }

    const firstMonthDate = `${last6Months[0]}-01`;
    const { data: expenses } = await supabase
        .from('expenses')
        .select('date, amount')
        .eq('org_id', orgId)
        .gte('date', firstMonthDate);

    expenses?.forEach(exp => {
        const m = exp.date.substring(0, 7);
        if (m === currentMonth) {
            totalExpenses += Number(exp.amount);
        }
        if (monthlyRevenueMap[m]) {
            monthlyRevenueMap[m].expenses += Number(exp.amount);
        }
    });

    Object.values(monthlyRevenueMap).forEach(m => {
        m.profit = m.collected - m.expenses;
    });

    const monthlyRevenue = Object.values(monthlyRevenueMap);
    const actionAlerts = await pendingCountsPromise;

    return {
        fullName: fullName || 'Admin',
        role,
        buildingCount,
        roomStats,
        financials: {
            totalRevenue,
            totalCollectedThisMonth,
            totalDebt,
            totalExpenses,
            monthlyRevenue
        },
        actionAlerts,
    };
}
