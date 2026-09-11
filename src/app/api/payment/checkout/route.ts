import { NextResponse } from 'next/server';
import { createPayOSClient } from '@/lib/payos';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { invoiceId, amount, description } = body;

        if (!invoiceId || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Accept either landlord (supabase auth) or tenant (cookie session)
        // Since we just need to generate a payment link, we can check if the invoice exists.
        const adminSupabase = createAdminClient();
        
        const { data: invoice } = await adminSupabase
            .from('invoices')
            .select('id, org_id')
            .eq('id', invoiceId)
            .single();

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Fetch payment settings for this organization
        const { data: paymentSettings } = await adminSupabase
            .from('payment_settings')
            .select('payos_client_id, payos_api_key, payos_checksum_key')
            .eq('org_id', invoice.org_id)
            .single();

        if (!paymentSettings?.payos_client_id || !paymentSettings?.payos_api_key || !paymentSettings?.payos_checksum_key) {
            return NextResponse.json({ error: 'Chủ nhà chưa cấu hình PayOS.' }, { status: 400 });
        }

        const dynamicPayos = createPayOSClient(
            paymentSettings.payos_client_id,
            paymentSettings.payos_api_key,
            paymentSettings.payos_checksum_key
        );

        // Must cast amount to Number because PayOS expects an integer amount
        const orderAmount = Number(amount);
        
        // Generate a unique order code based on invoiceId or timestamp
        // PayOS orderCode must be a number, max 53 bits.
        // We'll use a random 6-digit number + timestamp to ensure uniqueness.
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
        
        const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        const bodyData = {
            orderCode,
            amount: orderAmount,
            description: description || `Thanh toan hoa don`,
            returnUrl: `${YOUR_DOMAIN}/invoices?status=success`,
            cancelUrl: `${YOUR_DOMAIN}/invoices?status=cancelled`,
        };

        const paymentLinkData = await dynamicPayos.createPaymentLink(bodyData);

        // Lưu order_code vào CSDL để Webhook PayOS đối soát tự động
        await adminSupabase
            .from('invoices')
            .update({ order_code: orderCode })
            .eq('id', invoiceId);

        return NextResponse.json({ 
            checkoutUrl: paymentLinkData.checkoutUrl,
            orderCode 
        });

    } catch (error) {
        console.error('Error creating payment link:', error);
        return NextResponse.json(
            { error: 'Could not create payment link' },
            { status: 500 }
        );
    }
}
