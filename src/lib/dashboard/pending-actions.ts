'use server';

import dayjs from 'dayjs';
import { requireAuthOrg } from '@/lib/rbac/guard';
import { cache } from 'react';

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
 * Memoized per-request bằng React.cache(), sử dụng head: true để không tốn băng thông tải bảng.
 */
export const getPendingActionCounts = cache(async (): Promise<PendingActionCounts> => {
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
                .select('id', { count: 'exact', head: true })
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

        return {
            incidents: incRes.count || 0,
            unpaidInvoices: invRes.count || 0,
            expiringContracts: conRes.count || 0,
            totalDebt: 0,
        };
    } catch {
        return { incidents: 0, unpaidInvoices: 0, expiringContracts: 0, totalDebt: 0 };
    }
});
