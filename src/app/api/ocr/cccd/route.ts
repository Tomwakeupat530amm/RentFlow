import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callOpenRouterVision } from '@/lib/ocr/openrouter';

interface OcrResult {
    full_name?: string | null;
    id_number?: string | null;
    date_of_birth?: string | null;
    permanent_address?: string | null;
    raw_text: string;
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
        const mimeType = file.type || 'image/jpeg';

        const prompt = `Bạn là một hệ thống AI OCR chuyên phân tích Căn cước công dân (CCCD/CMND) Việt Nam. Hãy đọc ảnh và trích xuất các thông tin chính xác.
Trả về dữ liệu dưới định dạng JSON với cấu trúc chính xác sau:
{
    "full_name": "NGUYỄN VĂN A",
    "id_number": "012345678912",
    "date_of_birth": "YYYY-MM-DD",
    "permanent_address": "Địa chỉ thường trú hoặc Quê quán ghi trên thẻ",
    "raw_text": "Toàn bộ văn bản đọc được"
}
Lưu ý quan trọng:
- Bắt buộc chỉ trả về JSON Object hợp lệ.
- Chuyển đổi định dạng ngày sinh sang YYYY-MM-DD.
- Số CCCD gồm 12 chữ số hoặc CMND 9 chữ số.
- Nếu không thể trích xuất trường nào do ảnh mờ, hãy để giá trị null.`;

        const parsed = await callOpenRouterVision<OcrResult>({
            base64Image,
            mimeType,
            prompt,
        });

        return NextResponse.json({
            success: true,
            data: parsed,
        });
    } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xử lý ảnh CCCD';
        console.error('OCR CCCD error:', error);
        return NextResponse.json(
            { error: errMessage },
            { status: 500 }
        );
    }
}
