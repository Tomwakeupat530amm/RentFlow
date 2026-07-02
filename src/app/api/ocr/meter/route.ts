import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface MeterOcrResult {
    electricity_new?: number | null;
    water_new?: number | null;
    reading?: number | null;
    raw_text: string;
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
        const mimeType = file.type || 'image/jpeg';

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: true,
                data: { reading: null, raw_text: '[API Key chưa được cấu hình]' },
                message: 'API Key chưa được cấu hình.',
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash', 
            generationConfig: { responseMimeType: "application/json" } 
        });

        const prompt = `Bạn là hệ thống nhận diện số trên đồng hồ điện, nước. Hãy đọc ảnh và trích xuất chỉ số.
Lưu ý:
- Với đồng hồ nước: Bỏ qua các số phụ màu đỏ, chỉ lấy dãy số màu đen.
- Với đồng hồ điện tử: Chỉ lấy phần số chính, bỏ qua số thập phân phía sau.
Trả về dữ liệu dưới định dạng JSON với cấu trúc chính xác sau (cố gắng đoán loại đồng hồ nếu có thể):
{
    "reading": 12345,
    "electricity_new": 12345,
    "water_new": 1234,
    "raw_text": "Mô tả ngắn gọn lý do chọn số này (VD: đồng hồ nước lấy 4 số đầu)"
}
Quy tắc:
- Thuộc tính "electricity_new": Nếu bạn chắc chắn đây là đồng hồ điện thì điền số nguyên vào, nếu không phải hoặc không chắc, hãy trả về giá trị null.
- Thuộc tính "water_new": Nếu bạn chắc chắn đây là đồng hồ nước thì điền số nguyên vào, nếu không phải hoặc không chắc, hãy trả về giá trị null.
- Thuộc tính "reading": Bắt buộc điền số nguyên. Đây là số đọc lớn nhất hoặc có ý nghĩa nhất.
Chỉ trả về cú pháp JSON hợp lệ.`;

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
        const parsed: MeterOcrResult = JSON.parse(responseText);
        
        // Loại bỏ các trường null để tương thích với logic client (client dùng !== undefined)
        if (parsed.electricity_new === null) delete parsed.electricity_new;
        if (parsed.water_new === null) delete parsed.water_new;

        return NextResponse.json({
            success: true,
            data: parsed,
        });
    } catch (error) {
        console.error('Meter OCR error:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi xử lý ảnh' }, { status: 500 });
    }
}
