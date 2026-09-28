'use server';

import { createClient } from '@/lib/supabase/server';
import dayjs from 'dayjs';
import { PlanType, FREE_TIER_LIMITS, PremiumFeature, OrgUsage, Subscription } from '@/types/database';
import { cache } from 'react';
import { requireAuthOrg } from '@/lib/rbac/guard';

/**
 * Get the current org's plan type
 * Memoized per-request using React.cache()
 */
export const getOrgPlan = cache(async (): Promise<{ planType: PlanType; orgId: string | null }> => {
    try {
        const { supabase, orgId } = await requireAuthOrg();
        const { data: org } = await supabase
            .from('organizations')
            .select('plan_type')
            .eq('id', orgId)
            .single();

        return {
            planType: (org?.plan_type as PlanType) || 'free',
            orgId,
        };
    } catch {
        return { planType: 'free', orgId: null };
    }
});

/**
 * Get org usage stats (building + room count)
 * Memoized per-request using React.cache() and parallel head: true counts
 */
export const getOrgUsage = cache(async (): Promise<OrgUsage> => {
    try {
        const { supabase, orgId } = await requireAuthOrg();

        const [buildingsRes, roomsRes] = await Promise.all([
            supabase
                .from('buildings')
                .select('id', { count: 'exact', head: true })
                .eq('org_id', orgId)
                .is('deleted_at', null),
            supabase
                .from('rooms')
                .select('id, buildings!inner(org_id, deleted_at)', { count: 'exact', head: true })
                .eq('buildings.org_id', orgId)
                .is('deleted_at', null)
                .is('buildings.deleted_at', null),
        ]);

        return {
            building_count: buildingsRes.count || 0,
            room_count: roomsRes.count || 0,
        };
    } catch {
        return { building_count: 0, room_count: 0 };
    }
});

/**
 * Check if a premium feature is accessible
 */
export async function canAccessFeature(feature: PremiumFeature): Promise<boolean> {
    const { planType } = await getOrgPlan();
    if (planType === 'premium') return true;

    // Free tier: only basic features
    const freeFeatures: PremiumFeature[] = [];
    return freeFeatures.includes(feature);
}

/**
 * Check if org can add more buildings (free tier limit)
 */
export async function canAddBuilding(): Promise<{ allowed: boolean; current: number; limit: number }> {
    const { planType } = await getOrgPlan();
    if (planType === 'premium') return { allowed: true, current: 0, limit: Infinity };

    const usage = await getOrgUsage();
    return {
        allowed: usage.building_count < FREE_TIER_LIMITS.MAX_BUILDINGS,
        current: usage.building_count,
        limit: FREE_TIER_LIMITS.MAX_BUILDINGS,
    };
}

/**
 * Check if org can add more rooms (free tier limit)
 */
export async function canAddRoom(countToAdd: number = 1): Promise<{ allowed: boolean; current: number; limit: number }> {
    const { planType } = await getOrgPlan();
    if (planType === 'premium') return { allowed: true, current: 0, limit: Infinity };

    const usage = await getOrgUsage();
    return {
        allowed: (usage.room_count + countToAdd - 1) < FREE_TIER_LIMITS.MAX_ROOMS,
        current: usage.room_count,
        limit: FREE_TIER_LIMITS.MAX_ROOMS,
    };
}

/**
 * Get subscription history for current org
 */
export async function getSubscriptions(): Promise<Subscription[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) return [];

    const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

    return (data as Subscription[]) || [];
}

/**
 * Activate premium plan for org (admin/manual activation for now)
 */
export async function activatePremium(months: number = 1) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Chưa đăng nhập' };

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id, role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'owner') return { error: 'Chỉ owner mới có thể nâng cấp' };
    if (!profile?.org_id) return { error: 'Không tìm thấy tổ chức' };

    const expiresAt = dayjs().add(months, 'month').toDate();

    // Create subscription record
    const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
            org_id: profile.org_id,
            plan_type: 'premium',
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            status: 'active',
        });

    if (subError) return { error: subError.message };

    // Update org plan_type
    const { error: orgError } = await supabase
        .from('organizations')
        .update({ plan_type: 'premium' })
        .eq('id', profile.org_id);

    if (orgError) return { error: orgError.message };

    return { success: true, expires_at: expiresAt.toISOString() };
}
