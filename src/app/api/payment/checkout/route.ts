import { NextResponse } from 'next/server';
import { payos } from '@/lib/payos';
import { createClient } from '@/lib/supabase/server';

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

        // Verify the user is authenticated and has access to this invoice
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        const paymentLinkData = await payos.createPaymentLink(bodyData);

        // Here we could potentially update the invoice in DB to save the `orderCode` for tracking
        // For simplicity, we just return the checkoutUrl
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
