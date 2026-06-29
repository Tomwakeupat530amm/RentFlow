'use server';

import { createClient } from '@/lib/supabase/server';

export async function getActivityLogs() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) {
        throw new Error('Organization not found');
    }

    const { data, error } = await supabase
        .from('activity_logs')
        .select(`
            id,
            action,
            entity_type,
            entity_id,
            old_data,
            new_data,
            created_at,
            actor:user_profiles!actor_id (
                id,
                full_name,
                email
            )
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching activity logs:', error);
        throw new Error('Could not fetch activity logs');
    }

    return data;
}
