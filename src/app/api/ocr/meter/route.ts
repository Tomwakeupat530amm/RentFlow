import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callOpenRouterVision } from '@/lib/ocr/openrouter';

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

        const prompt = `Bạn là hệ thống AI nhận diện số trên đồng hồ công tơ điện và nước. Hãy đọc ảnh và trích xuất chỉ số.
Lưu ý quan trọng:
- Với đồng hồ nước: Bỏ qua các số phụ màu đỏ hoặc kim phụ, CHỈ lấy dãy số màu đen (chỉ số mét khối).
- Với đồng hồ điện tử: Chỉ lấy phần số chính trước dấu chấm/phẩy, bỏ qua số thập phân.
- Với đồng hồ điện cơ: Lấy phần số màu đen, bỏ qua ô số đỏ cuối cùng (nếu có).

Trả về dữ liệu dưới định dạng JSON với cấu trúc chính xác sau (cố gắng đoán loại đồng hồ nếu có thể):
{
    "reading": 12345,
    "electricity_new": 12345,
    "water_new": 1234,
    "raw_text": "Mô tả ngắn gọn lý do chọn số này (VD: đồng hồ nước lấy 4 số đen đầu)"
}
Quy tắc:
- Thuộc tính "electricity_new": Nếu bạn chắc chắn đây là đồng hồ điện thì điền số nguyên vào, nếu không phải hoặc không chắc, hãy trả về giá trị null.
- Thuộc tính "water_new": Nếu bạn chắc chắn đây là đồng hồ nước thì điền số nguyên vào, nếu không phải hoặc không chắc, hãy trả về giá trị null.
- Thuộc tính "reading": Bắt buộc điền số nguyên. Đây là số đọc lớn nhất hoặc có ý nghĩa nhất.
Chỉ trả về cú pháp JSON Object hợp lệ.`;

        const parsed = await callOpenRouterVision<MeterOcrResult>({
            base64Image,
            mimeType,
            prompt,
        });

        // Loại bỏ các trường null để tương thích với logic client (client dùng !== undefined)
        if (parsed.electricity_new === null) delete parsed.electricity_new;
        if (parsed.water_new === null) delete parsed.water_new;

        return NextResponse.json({
            success: true,
            data: parsed,
        });
    } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xử lý ảnh công tơ';
        console.error('Meter OCR error:', error);
        return NextResponse.json(
            { error: errMessage },
            { status: 500 }
        );
    }
}
