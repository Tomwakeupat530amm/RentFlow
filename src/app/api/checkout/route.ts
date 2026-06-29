import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { payos } from '@/lib/payos';
import { getOrgPlan } from '@/lib/subscription/actions';

export async function POST(req: Request) {
    try {
        const { months = 1 } = await req.json();
        
        const supabase = await createClient();
        const { orgId, planType: currentPlan } = await getOrgPlan();

        if (!orgId) {
            return NextResponse.json({ error: 'Chưa đăng nhập hoặc không có tổ chức' }, { status: 401 });
        }
        
        if (currentPlan === 'premium') {
            return NextResponse.json({ error: 'Tổ chức này đã nâng cấp Premium' }, { status: 400 });
        }

        // Tạo orderCode ngẫu nhiên (PayOS yêu cầu orderCode phải là số nguyên dương <= 9007199254740991)
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
        
        // Giá gói Premium theo yêu cầu của user: 99,000đ/tháng
        const pricePerMonth = 99000;
        const totalAmount = pricePerMonth * months;

        // Lưu thông tin giao dịch vào CSDL với trạng thái PENDING
        const { data: transaction, error: insertError } = await supabase
            .from('payment_transactions')
            .insert({
                org_id: orgId,
                amount: totalAmount,
                status: 'PENDING',
                order_code: orderCode
            })
            .select()
            .single();
            
        if (insertError) {
            console.error('DB Insert Error:', insertError);
            return NextResponse.json({ error: 'Lỗi cơ sở dữ liệu' }, { status: 500 });
        }

        // Tùy thuộc vào môi trường để lấy origin đúng
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:3000';

        const body = {
            orderCode: orderCode,
            amount: totalAmount,
            description: `Nang cap Premium ${months}T`,
            items: [
                {
                    name: 'Gói Premium RentFlow',
                    quantity: months,
                    price: pricePerMonth
                }
            ],
            returnUrl: `${baseUrl}/pricing?status=success&orderCode=${orderCode}`,
            cancelUrl: `${baseUrl}/pricing?status=cancelled&orderCode=${orderCode}`,
        };

        const paymentLinkResponse = await payos.createPaymentLink(body);

        // Cập nhật lại checkout_url vào CSDL
        await supabase
            .from('payment_transactions')
            .update({ checkout_url: paymentLinkResponse.checkoutUrl })
            .eq('id', transaction.id);

        return NextResponse.json({ checkoutUrl: paymentLinkResponse.checkoutUrl });

    } catch (error: unknown) {
        console.error('Checkout API Error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Lỗi server nội bộ' }, { status: 500 });
    }
}
