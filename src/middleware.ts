import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
    // Check if accessing Tenant Portal
    if (request.nextUrl.pathname.startsWith('/portal')) {
        const isLoginPage = request.nextUrl.pathname === '/portal/login';
        const session = request.cookies.get('tenant-session')?.value;

        if (!session && !isLoginPage) {
            return NextResponse.redirect(new URL('/portal/login', request.url));
        }

        if (session && isLoginPage) {
            return NextResponse.redirect(new URL('/portal/dashboard', request.url));
        }

        return NextResponse.next();
    }

    // Default Supabase Auth for Admin/Host
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
