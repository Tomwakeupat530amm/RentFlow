import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profile = { full_name: 'User', role: 'member' };
    if (user) {
        const { data } = await supabase
            .from('user_profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();
        if (data) {
            profile = data;
        }
    }

    return (
        <MainLayout
            userId={user?.id || ''}
            userName={profile.full_name || 'User'}
            userRole={profile.role || 'member'}
        >
            {children}
        </MainLayout>
    );
}
