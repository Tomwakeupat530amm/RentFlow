import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client using SERVICE_ROLE_KEY.
 * BYPASSES RLS — only use for trusted server-side operations
 * like registration flows where user is not yet authenticated.
 */
export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
