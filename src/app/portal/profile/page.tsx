export const dynamic = 'force-dynamic';
/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { clearTenantSession } from '@/lib/tenant-auth';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage({ params }: any) {
    const session = await getTenantSession();
    if (!session) return null;

    const handleLogout = async () => {
        'use server';
        await clearTenantSession();
        redirect('/portal/login');
    };

        return <ProfileClient session={session} handleLogout={handleLogout} />;
}
