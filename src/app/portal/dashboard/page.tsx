/* eslint-disable */
// @ts-nocheck
export const dynamic = 'force-dynamic';

import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardClient from './DashboardClient';

export default async function DashboardPage({ params }: any) {
    const session = await getTenantSession();
    if (!session) return null;

    const supabase = createAdminClient();

    // Lấy thông tin phòng
    let roomInfo = null;
    if (session.room_id) {
        const { data: room } = await supabase
            .from('rooms')
            .select('name, price')
            .eq('id', session.room_id)
            .single();
        roomInfo = room;
    }

    // Lấy hoá đơn chưa thanh toán
    const { data: unpaidInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('room_id', session.room_id)
        .eq('status', 'unpaid')
        .order('created_at', { ascending: false })
        .limit(3);

    // Lấy sự cố gần đây
    const { data: recentIncidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('room_id', session.room_id)
        .order('created_at', { ascending: false })
        .limit(3);

        return <DashboardClient session={session} roomInfo={roomInfo} unpaidInvoices={unpaidInvoices} recentIncidents={recentIncidents} />;
}
