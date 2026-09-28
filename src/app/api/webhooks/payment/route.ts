import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { payos } from '@/lib/payos';
import dayjs from 'dayjs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Verify webhook signature to ensure it comes from PayOS
        const webhookData = payos.verifyPaymentWebhookData(body);

        if (webhookData.code === '00' || webhookData.success) {
            // Lấy thông tin order code
            const orderCode = webhookData.orderCode;
            
            // Sử dụng Admin client (Service Role Key) vì webhook không có user session/cookies
            const supabase = createAdminClient();

            // Tìm transaction theo orderCode
            const { data: transaction, error: findError } = await supabase
                .from('payment_transactions')
                .select('*')
                .eq('order_code', orderCode)
                .single();

            if (findError || !transaction) {
                console.error('Transaction not found for webhook orderCode:', orderCode);
                return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
            }

            if (transaction.status === 'PAID') {
                return NextResponse.json({ message: 'Transaction already processed' });
            }

            // Update transaction status
            await supabase
                .from('payment_transactions')
                .update({ status: 'PAID', paid_at: new Date().toISOString() })
                .eq('id', transaction.id);

            // Activate Premium Plan cho organization
            const orgId = transaction.org_id;

            // Xác định thời hạn (mặc định 1 tháng, nếu cần phân tích từ description hoặc price để tính số tháng)
            // Trong đồ án, mặc định là 1 tháng (99,000 VND)
            const months = Math.round(transaction.amount / 99000);
            const expiresAt = dayjs().add(months, 'month').toDate();

            // 1. Cập nhật subscriptions
            await supabase
                .from('subscriptions')
                .insert({
                    org_id: orgId,
                    plan_type: 'premium',
                    starts_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                    status: 'active',
                    transaction_id: transaction.id
                });

            // 2. Cập nhật organizations.plan_type
            await supabase
                .from('organizations')
                .update({ plan_type: 'premium' })
                .eq('id', orgId);

            return NextResponse.json({ message: 'Webhook processed successfully' });
        }

        return NextResponse.json({ message: 'Webhook ignored, not a success event' });

    } catch (error: unknown) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
    }
}

