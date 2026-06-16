import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface OcrResult {
    full_name?: string;
    id_number?: string;
    date_of_birth?: string;
    permanent_address?: string;
    raw_text: string;
}

/**
 * Parse Vietnamese CCCD/CMND from OCR text
 */
function parseCccdText(text: string): OcrResult {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const fullText = lines.join(' ');

    let full_name: string | undefined;
    let id_number: string | undefined;
    let date_of_birth: string | undefined;
    let permanent_address: string | undefined;

    // Extract ID number (12 digits for CCCD, 9 digits for CMND)
    const idMatch = fullText.match(/\b(\d{12}|\d{9})\b/);
    if (idMatch) {
        id_number = idMatch[1];
    }

    // Extract full name — look for patterns like "Họ và tên / Full name:" or "Name:"
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // Name patterns
        if (lowerLine.includes('họ và tên') || lowerLine.includes('full name') || lowerLine.includes('ho va ten')) {
            const nameMatch = line.match(/(?:họ và tên|full name|ho va ten)[:\s]*(.+)/i);
            if (nameMatch && nameMatch[1].trim().length > 2) {
                full_name = nameMatch[1].trim().replace(/[^a-zA-ZÀ-ỹ\s]/g, '').trim();
            } else if (i + 1 < lines.length && !lines[i + 1].match(/^\d/) && lines[i + 1].length > 2) {
                full_name = lines[i + 1].replace(/[^a-zA-ZÀ-ỹ\s]/g, '').trim();
            }
        }

        // Date of birth patterns
        if (lowerLine.includes('ngày sinh') || lowerLine.includes('date of birth') || lowerLine.includes('sinh ngày')) {
            const dateMatch = line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
            if (dateMatch) {
                date_of_birth = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
            } else if (i + 1 < lines.length) {
                const nextDateMatch = lines[i + 1].match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
                if (nextDateMatch) {
                    date_of_birth = `${nextDateMatch[3]}-${nextDateMatch[2].padStart(2, '0')}-${nextDateMatch[1].padStart(2, '0')}`;
                }
            }
        }

        // Address patterns
        if (lowerLine.includes('nơi thường trú') || lowerLine.includes('quê quán') || lowerLine.includes('place of residence') || lowerLine.includes('noi thuong tru')) {
            const addrMatch = line.match(/(?:nơi thường trú|quê quán|place of residence|noi thuong tru)[:\s]*(.+)/i);
            if (addrMatch && addrMatch[1].trim().length > 3) {
                permanent_address = addrMatch[1].trim();
            } else if (i + 1 < lines.length && lines[i + 1].length > 3) {
                permanent_address = lines[i + 1].trim();
                // Concatenate next line if it doesn't start a new field
                if (i + 2 < lines.length && !lines[i + 2].match(/(ngày|giới|quốc|đặc điểm|date|sex|nationality)/i) && lines[i + 2].length > 2) {
                    permanent_address += ', ' + lines[i + 2].trim();
                }
            }
        }
    }

    // Fallback: try to find date format anywhere in text
    if (!date_of_birth) {
        const dateMatch = fullText.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
        if (dateMatch) {
            date_of_birth = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
        }
    }

    return { full_name, id_number, date_of_birth, permanent_address, raw_text: text };
}

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }

        // Check premium access
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
                    { error: 'Tính năng AI OCR chỉ dành cho gói Premium' },
                    { status: 403 }
                );
            }
        }

        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: 'Chưa tải ảnh lên' }, { status: 400 });
        }

        // Convert to base64
        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');

        // Use Google Cloud Vision API
        const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

        if (!apiKey) {
            // Fallback: return a demo result for development
            return NextResponse.json({
                success: true,
                data: {
                    full_name: undefined,
                    id_number: undefined,
                    date_of_birth: undefined,
                    permanent_address: undefined,
                    raw_text: '[API Key chưa được cấu hình. Vui lòng thêm GOOGLE_CLOUD_VISION_API_KEY vào .env.local]',
                },
                message: 'API Key chưa được cấu hình. Tính năng OCR sẽ hoạt động khi có API Key.',
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
                            imageContext: {
                                languageHints: ['vi'],
                            },
                        },
                    ],
                }),
            }
        );

        if (!visionResponse.ok) {
            const errorBody = await visionResponse.text();
            console.error('Vision API error:', errorBody);
            return NextResponse.json(
                { error: 'Lỗi khi gọi API nhận dạng ảnh' },
                { status: 500 }
            );
        }

        const visionData = await visionResponse.json();
        const rawText = visionData.responses?.[0]?.fullTextAnnotation?.text || '';

        if (!rawText) {
            return NextResponse.json(
                { error: 'Không thể đọc được nội dung từ ảnh. Vui lòng thử ảnh rõ nét hơn.' },
                { status: 422 }
            );
        }

        const parsed = parseCccdText(rawText);

        return NextResponse.json({
            success: true,
            data: parsed,
        });
    } catch (error) {
        console.error('OCR error:', error);
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi khi xử lý ảnh' },
            { status: 500 }
        );
    }
}
