'use server';

import dayjs from 'dayjs';
import { requireAuthOrg } from '@/lib/rbac/guard';

export interface PendingActionCounts {
    incidents: number;
    unpaidInvoices: number;
    expiringContracts: number;
    totalDebt: number;
}

/**
 * Lấy số lượng công việc đang chờ xử lý theo tổ chức hiện tại:
 * - Sự cố: status in ('reported', 'in_progress')
 * - Hoá đơn: status in ('sent', 'partially_paid', 'overdue')
 * - Hợp đồng: status = 'active' và sắp hết hạn trong 30 ngày
 */
export async function getPendingActionCounts(): Promise<PendingActionCounts> {
    try {
        const auth = await requireAuthOrg();
        const { supabase, orgId } = auth;
        const todayStr = dayjs().format('YYYY-MM-DD');
        const thirtyDaysLater = dayjs().add(30, 'day').format('YYYY-MM-DD');

        const [incRes, invRes, conRes] = await Promise.all([
            supabase
                .from('incidents')
                .select('id', { count: 'exact', head: true })
                .eq('org_id', orgId)
                .in('status', ['reported', 'in_progress']),
            supabase
                .from('invoices')
                .select('id, total_amount, paid_amount', { count: 'exact' })
                .eq('org_id', orgId)
                .in('status', ['sent', 'partially_paid', 'overdue']),
            supabase
                .from('contracts')
                .select('id', { count: 'exact', head: true })
                .eq('org_id', orgId)
                .eq('status', 'active')
                .is('deleted_at', null)
                .gte('end_date', todayStr)
                .lte('end_date', thirtyDaysLater),
        ]);

        let totalDebt = 0;
        if (invRes.data) {
            invRes.data.forEach((inv) => {
                totalDebt += (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
            });
        }

        return {
            incidents: incRes.count || 0,
            unpaidInvoices: invRes.count || 0,
            expiringContracts: conRes.count || 0,
            totalDebt,
        };
    } catch {
        return { incidents: 0, unpaidInvoices: 0, expiringContracts: 0, totalDebt: 0 };
    }
}
