export const dynamic = 'force-dynamic';
/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { clearTenantSession } from '@/lib/tenant-auth';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage({ params }: any) {
    const session = await getTenantSession();
    if (!session) return null;

    // Resolve room_id → human-readable "Phòng X - Tòa Y"
    let roomDisplay: string | null = null;
    if (session.room_id) {
        const supabase = await createClient();
        const { data: roomData } = await supabase
            .from('rooms')
            .select('name, building:buildings(name)')
            .eq('id', session.room_id)
            .single();
        if (roomData) {
            const buildingName = (roomData.building as any)?.name;
            roomDisplay = buildingName
                ? `Phòng ${roomData.name} - ${buildingName}`
                : `Phòng ${roomData.name}`;
        }
    }

    const handleLogout = async () => {
        'use server';
        await clearTenantSession();
        redirect('/portal/login');
    };

    return <ProfileClient session={session} handleLogout={handleLogout} roomDisplay={roomDisplay} />;
}
