import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Fallback: return a demo result for development
            return NextResponse.json({
                success: true,
                data: {
                    full_name: null,
                    id_number: null,
                    date_of_birth: null,
                    permanent_address: null,
                    raw_text: '[API Key chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env.local]',
                },
                message: 'API Key chưa được cấu hình. Tính năng OCR sẽ hoạt động khi có API Key.',
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash', 
            generationConfig: { responseMimeType: "application/json" } 
        });

        const prompt = `Bạn là một hệ thống OCR phân tích Căn cước công dân (CCCD/CMND) Việt Nam. Hãy đọc ảnh và trích xuất các thông tin sau.
Trả về dữ liệu dưới định dạng JSON với cấu trúc chính xác sau:
{
    "full_name": "Nguyễn Văn A",
    "id_number": "012345678912",
    "date_of_birth": "YYYY-MM-DD",
    "permanent_address": "Địa chỉ thường trú hoặc Quê quán ghi trên thẻ",
    "raw_text": "Toàn bộ văn bản thô bạn đọc được để debug"
}
Lưu ý quan trọng: 
- Chỉ trả về chuỗi JSON hợp lệ. 
- Chuyển đổi định dạng ngày sinh sang YYYY-MM-DD.
- Tên viết hoa chữ cái đầu.
- Nếu không thể trích xuất trường nào do ảnh mờ, hãy để giá trị null.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]);
        
        const responseText = result.response.text();
        const parsed: OcrResult = JSON.parse(responseText);

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
