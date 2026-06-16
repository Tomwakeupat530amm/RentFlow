export const dynamic = 'force-dynamic';
/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import IncidentsClient from './IncidentsClient';

export default async function IncidentsPage({ params }: any) {
    const session = await getTenantSession();
    if (!session || !session.room_id) return null;

    const supabase = createAdminClient();

    const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('room_id', session.room_id)
        .order('created_at', { ascending: false });

        return <IncidentsClient session={session} incidents={incidents} />;
}
