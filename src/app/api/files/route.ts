import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const bucket = searchParams.get('bucket');
        const path = searchParams.get('path');

        if (!bucket || !path) {
            return new NextResponse('Missing bucket or path', { status: 400 });
        }

        const supabase = await createClient();
        
        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Download the file from Supabase Storage
        // Supabase RLS will automatically enforce that the user can only download this file
        // if they meet the policies (e.g. the first folder is their org_id).
        const { data, error } = await supabase.storage.from(bucket).download(path);

        if (error || !data) {
            console.error('Error downloading file:', error);
            return new NextResponse('File not found or access denied', { status: 404 });
        }

        // Return the file with appropriate headers
        return new NextResponse(data, {
            headers: {
                'Content-Type': data.type || 'application/octet-stream',
                'Cache-Control': 'private, max-age=3600',
            }
        });

    } catch (error: unknown) {
        console.error('File proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
