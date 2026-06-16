import { NextResponse } from 'next/server';
import { payos } from '@/lib/payos';

// Define a webhook handler for PayOS
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Verify webhook data (using PayOS checksum)
        try {
            const webhookData = payos.verifyPaymentWebhookData(body);
            
            if (webhookData.code === '00' && webhookData.data) {
                // Payment was successful
                const { orderCode, amount } = webhookData.data;

                // For a real implementation, you need a way to link `orderCode` to an `invoice_id`.
                // Example: We find the invoice by matching orderCode saved in DB, or assuming
                // orderCode directly maps to an invoice. 
                // Alternatively, just log the success for now as this is a demo.
                console.log(`Payment successful for order: ${orderCode}, amount: ${amount}`);

                return NextResponse.json({
                    error: 0,
                    message: "Ok",
                    data: webhookData.data
                });
            }
        } catch (verifyError) {
            console.error('Webhook verification failed:', verifyError);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        return NextResponse.json({ error: 0, message: "Ok" });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
