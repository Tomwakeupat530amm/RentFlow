export const dynamic = 'force-dynamic';

import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
    const session = await getTenantSession();
    if (!session) return null;

    // Trường hợp khách chưa được xếp phòng
    if (!session.room_id) {
        return (
            <DashboardClient
                session={session}
                roomInfo={null}
                unpaidInvoices={[]}
                recentIncidents={[]}
            />
        );
    }

    const supabase = createAdminClient();

    // 1. Lấy thông tin phòng
    const { data: room } = await supabase
        .from('rooms')
        .select('name, default_rent')
        .eq('id', session.room_id)
        .single();

    // 2. Lấy hoá đơn chưa thanh toán hoặc thanh toán một phần
    const { data: unpaidInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('room_id', session.room_id)
        .in('status', ['unpaid', 'partial'])
        .order('created_at', { ascending: false })
        .limit(3);

    // 3. Lấy sự cố gần đây
    const { data: recentIncidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('room_id', session.room_id)
        .order('created_at', { ascending: false })
        .limit(3);

    return (
        <DashboardClient
            session={session}
            roomInfo={room}
            unpaidInvoices={unpaidInvoices || []}
            recentIncidents={recentIncidents || []}
        />
    );
}
