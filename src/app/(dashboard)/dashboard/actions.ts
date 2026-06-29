'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id, full_name, role')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return null;

    // Get buildings count
    const { count: buildingCount } = await supabase
        .from('buildings')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .is('deleted_at', null);

    // Get all rooms for this org
    const { data: buildings } = await supabase
        .from('buildings')
        .select('id')
        .eq('org_id', profile.org_id)
        .is('deleted_at', null);

    const buildingIds = buildings?.map(b => b.id) || [];

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
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    let totalRevenue = 0;
    let totalCollectedThisMonth = 0;
    let totalDebt = 0;
    let totalExpenses = 0;

    // Generate last 6 months list
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toISOString().slice(0, 7);
    }).reverse();

    const monthlyRevenueMap: Record<string, { month: string, revenue: number, collected: number, expenses: number, profit: number }> = {};
    last6Months.forEach(m => {
        monthlyRevenueMap[m] = { month: m, revenue: 0, collected: 0, expenses: 0, profit: 0 };
    });

    if (buildingIds.length > 0) {
        const { data: invoices } = await supabase
            .from('invoices')
            .select('month, status, total_amount, paid_amount')
            .eq('org_id', profile.org_id)
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
        .eq('org_id', profile.org_id)
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

    return {
        fullName: profile.full_name || 'Admin',
        role: profile.role,
        buildingCount: buildingCount || 0,
        roomStats,
        financials: {
            totalRevenue,
            totalCollectedThisMonth,
            totalDebt,
            totalExpenses,
            monthlyRevenue
        }
    };
}
