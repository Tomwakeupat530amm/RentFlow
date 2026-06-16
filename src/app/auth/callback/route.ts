import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * OAuth callback handler.
 * After Google login, Supabase redirects here with a code.
 * We exchange it for a session, then redirect to dashboard.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if user has an org. If not, redirect to setup page.
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('org_id')
                    .eq('id', user.id)
                    .single();

                // If no org, user needs to create or join one
                if (!profile?.org_id) {
                    return NextResponse.redirect(`${origin}/register?setup=org`);
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // OAuth error — redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth`);
}
