'use server';

import { requireAuthOrg } from '@/lib/rbac/guard';

export async function getActivityLogs() {
    const { supabase, orgId } = await requireAuthOrg();

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
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching activity logs:', error);
        throw new Error('Could not fetch activity logs');
    }

    return data;
}
