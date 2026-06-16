import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Parse meter reading from OCR text
 */
function parseMeterReading(text: string): { reading: number | null; raw_text: string } {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const fullText = lines.join(' ');

    // Look for sequences of digits that could be meter readings (typically 4-8 digits)
    const numbers = fullText.match(/\b(\d{4,8})\b/g);

    if (numbers && numbers.length > 0) {
        // Take the largest number as the most likely meter reading
        const sorted = numbers.map(Number).sort((a, b) => b - a);
        return { reading: sorted[0], raw_text: text };
    }

    return { reading: null, raw_text: text };
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }

        // Premium check
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (profile?.org_id) {
            const { data: org } = await supabase
                .from('organizations')
                .select('plan_type')
                .eq('id', profile.org_id)
                .single();

            if (org?.plan_type !== 'premium') {
                return NextResponse.json(
                    { error: 'Tính năng quét đồng hồ chỉ dành cho gói Premium' },
                    { status: 403 }
                );
            }
        }

        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: 'Chưa tải ảnh lên' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');

        const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: true,
                data: { reading: null, raw_text: '[API Key chưa được cấu hình]' },
                message: 'API Key chưa được cấu hình.',
            });
        }

        const visionResponse = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [
                        {
                            image: { content: base64Image },
                            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
                        },
                    ],
                }),
            }
        );

        if (!visionResponse.ok) {
            return NextResponse.json({ error: 'Lỗi khi gọi API nhận dạng ảnh' }, { status: 500 });
        }

        const visionData = await visionResponse.json();
        const rawText = visionData.responses?.[0]?.fullTextAnnotation?.text || '';

        if (!rawText) {
            return NextResponse.json(
                { error: 'Không thể đọc số từ ảnh. Vui lòng chụp rõ nét hơn.' },
                { status: 422 }
            );
        }

        const parsed = parseMeterReading(rawText);

        return NextResponse.json({
            success: true,
            data: parsed,
        });
    } catch (error) {
        console.error('Meter OCR error:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi xử lý ảnh' }, { status: 500 });
    }
}
