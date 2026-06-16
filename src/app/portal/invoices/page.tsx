export const dynamic = 'force-dynamic';
/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import InvoicesClient from './InvoicesClient';

export default async function InvoicesPage({ params }: any) {
    const session = await getTenantSession();
    if (!session || !session.room_id) return null;

    const supabase = createAdminClient();

    const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('room_id', session.room_id)
        .order('created_at', { ascending: false });

        return <InvoicesClient session={session} invoices={invoices} />;
}
