import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import PricingClient from './PricingClient';

export default async function PricingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id, role')
        .eq('id', user.id)
        .single();

    let currentPlan = 'free';
    if (profile?.org_id) {
        const { data: org } = await supabase
            .from('organizations')
            .select('plan_type')
            .eq('id', profile.org_id)
            .single();
        currentPlan = org?.plan_type || 'free';
    }

    return (
        <Suspense fallback={<div>Loading pricing...</div>}>
            <PricingClient
                currentPlan={currentPlan as 'free' | 'premium'}
                isOwner={profile?.role === 'owner'}
            />
        </Suspense>
    );
}
