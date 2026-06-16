import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client với Service Role Key để bỏ qua RLS khi xử lý webhook (từ server)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        console.log('🔔 [Webhook PayOS] Nhận payload:', JSON.stringify(body, null, 2));

        if (body.code !== '00' || !body.success) {
            console.log('⚠️ [Webhook PayOS] Giao dịch không thành công hoặc payload không hợp lệ.');
            return NextResponse.json({ success: true, message: 'Received but not processed (failed status)' });
        }

        const data = body.data;
        const amount = data.amount;
        const description = data.description || '';
        
        // Trong môi trường thực tế, PayOS cho phép truyền orderCode (số).
        // Tuy nhiên hoá đơn của chúng ta dùng UUID.
        // Mock này sử dụng addInfo/description chứa chuỗi invoice.id
        // Ví dụ: description chứa UUID của hoá đơn
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = description.match(uuidRegex);

        let invoiceId = null;
        if (match) {
            invoiceId = match[0];
        } else {
            console.log('⚠️ [Webhook PayOS] Không tìm thấy UUID hoá đơn trong description:', description);
            return NextResponse.json({ success: true, message: 'Invoice ID not found in description' });
        }

        console.log(`🚀 [Webhook PayOS] Đang xử lý thanh toán cho Hoá Đơn: ${invoiceId}, Số tiền: ${amount}`);

        // Lấy thông tin hoá đơn hiện tại
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('paid_amount')
            .eq('id', invoiceId)
            .single();

        if (fetchError || !invoice) {
            console.error('❌ [Webhook PayOS] Lỗi lấy thông tin hoá đơn:', fetchError?.message);
            return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
        }

        const newPaidAmount = Number(invoice.paid_amount) + Number(amount);

        // Cập nhật số tiền đã thanh toán (Database Trigger sẽ tự cập nhật status)
        const { error: updateError } = await supabase
            .from('invoices')
            .update({ paid_amount: newPaidAmount })
            .eq('id', invoiceId);

        if (updateError) {
            console.error('❌ [Webhook PayOS] Lỗi cập nhật hoá đơn:', updateError.message);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        console.log(`✅ [Webhook PayOS] Cập nhật thành công! Tổng đã trả: ${newPaidAmount}`);
        return NextResponse.json({ success: true, message: 'Payment recorded successfully' });

    } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [Webhook PayOS] Lỗi exception:', errMessage);
        return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
    }
}
