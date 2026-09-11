import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPayOSClient } from '@/lib/payos';

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
        const amount = Number(data.amount || 0);
        const description = data.description || '';
        const orderCode = data.orderCode ? Number(data.orderCode) : null;
        
        let invoice: { id: string; paid_amount: number; total_amount: number; status: string; org_id: string } | null = null;

        // 1. Ưu tiên đối soát theo orderCode số (do PayOS trả về chuẩn)
        if (orderCode) {
            const { data: invByCode, error: errByCode } = await supabase
                .from('invoices')
                .select('id, paid_amount, total_amount, status, org_id')
                .eq('order_code', orderCode)
                .maybeSingle();

            if (!errByCode && invByCode) {
                invoice = invByCode;
                console.log(`🎯 [Webhook PayOS] Khớp hoá đơn qua order_code: ${orderCode} -> ID: ${invoice.id}`);
            }
        }

        // 2. Fallback: Nếu không tìm thấy qua orderCode, trích xuất UUID từ description
        if (!invoice && description) {
            const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
            const match = description.match(uuidRegex);
            if (match) {
                const { data: invById, error: errById } = await supabase
                    .from('invoices')
                    .select('id, paid_amount, total_amount, status, org_id')
                    .eq('id', match[0])
                    .maybeSingle();

                if (!errById && invById) {
                    invoice = invById;
                    console.log(`🎯 [Webhook PayOS] Khớp hoá đơn qua UUID trong description: ${invoice.id}`);
                }
            }
        }

        if (!invoice) {
            console.log('⚠️ [Webhook PayOS] Không tìm thấy hoá đơn tương ứng (orderCode / description):', { orderCode, description });
            return NextResponse.json({ success: true, message: 'Invoice not found in system, ignored.' });
        }

        console.log(`🚀 [Webhook PayOS] Đang xử lý thanh toán cho Hoá Đơn: ${invoice.id}, Số tiền: ${amount}`);

        // 3. Kiểm tra tính Idempotent: Nếu hoá đơn đã thanh toán đủ từ trước
        if (invoice.status === 'paid' && Number(invoice.paid_amount) >= Number(invoice.total_amount)) {
            console.log(`ℹ️ [Webhook PayOS] Hoá đơn ${invoice.id} đã hoàn tất thanh toán trước đó.`);
            return NextResponse.json({ success: true, message: 'Invoice already marked as paid' });
        }

        // 4. Lấy cấu hình PayOS của tổ chức để xác thực Webhook Signature (nếu có cấu hình)
        const { data: settings } = await supabase
            .from('payment_settings')
            .select('payos_client_id, payos_api_key, payos_checksum_key')
            .eq('org_id', invoice.org_id)
            .maybeSingle();

        if (settings?.payos_client_id && settings?.payos_api_key && settings?.payos_checksum_key) {
            try {
                const dynamicPayos = createPayOSClient(settings.payos_client_id, settings.payos_api_key, settings.payos_checksum_key);
                dynamicPayos.verifyPaymentWebhookData(body);
                console.log('✅ [Webhook PayOS] Xác thực chữ ký thành công.');
            } catch (verifyError) {
                console.error('❌ [Webhook PayOS] Lỗi xác thực chữ ký (Invalid Signature):', verifyError);
                return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
            }
        } else {
            console.log('⚠️ [Webhook PayOS] Tổ chức chưa cấu hình PayOS Key đầy đủ, bỏ qua bước verify.');
        }

        const newPaidAmount = Number(invoice.paid_amount || 0) + amount;
        const totalAmount = Number(invoice.total_amount || 0);
        const newStatus = newPaidAmount >= totalAmount ? 'paid' : (newPaidAmount > 0 ? 'partial' : invoice.status);

        // 5. Cập nhật số tiền đã thanh toán và trạng thái hoá đơn
        const updatePayload: Record<string, unknown> = { 
            paid_amount: newPaidAmount,
            status: newStatus,
        };

        if (newStatus === 'paid') {
            updatePayload.paid_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('invoices')
            .update(updatePayload)
            .eq('id', invoice.id);

        if (updateError) {
            console.error('❌ [Webhook PayOS] Lỗi cập nhật hoá đơn:', updateError.message);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        console.log(`✅ [Webhook PayOS] Cập nhật thành công hoá đơn ${invoice.id}! Tổng đã trả: ${newPaidAmount} / ${totalAmount}, Trạng thái: ${newStatus}`);
        return NextResponse.json({ success: true, message: 'Payment recorded successfully' });

    } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [Webhook PayOS] Lỗi exception:', errMessage);
        return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
    }
}
