import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

// Khởi tạo Supabase Admin Client để bỏ qua RLS khi chạy Cron Job
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
    try {
        // Basic security check via API route auth header if needed
        // (Vercel Cron requests have a special header: x-vercel-cron)
        const authHeader = request.headers.get('authorization');
        const isVercelCron = request.headers.get('x-vercel-cron');

        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && !isVercelCron) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = dayjs().format('YYYY-MM-DD');
        const in3Days = dayjs().add(3, 'day').format('YYYY-MM-DD');

        // 1. Quét các hợp đồng sắp hết hạn (còn 3 ngày)
        const { data: expiringContracts, error: contractsError } = await supabaseAdmin
            .from('contracts')
            .select('id, org_id, end_date, room:rooms(name), tenant:tenants(full_name)')
            .eq('status', 'active')
            .eq('end_date', in3Days);

        if (contractsError) {
            console.error('Error fetching expiring contracts:', contractsError);
        } else if (expiringContracts && expiringContracts.length > 0) {
            // Lọc các reminder đã tồn tại cho hợp đồng này
            const contractIds = expiringContracts.map(c => c.id);
            const { data: existingContractReminders } = await supabaseAdmin
                .from('reminders')
                .select('entity_id')
                .eq('entity_type', 'contract')
                .in('entity_id', contractIds);

            const existingIds = new Set(existingContractReminders?.map(r => r.entity_id) || []);
            const newContracts = expiringContracts.filter(c => !existingIds.has(c.id));

            if (newContracts.length > 0) {
                const contractReminders = newContracts.map(c => ({
                    org_id: c.org_id,
                    entity_type: 'contract',
                    entity_id: c.id,
                    message: `Hợp đồng phòng ${(c.room as { name?: string })?.name || ''} của khách ${(c.tenant as { full_name?: string })?.full_name || ''} sẽ hết hạn vào ${dayjs(c.end_date).format('DD/MM/YYYY')}.`,
                    due_date: c.end_date,
                    is_read: false
                }));

                await supabaseAdmin.from('reminders').insert(contractReminders);
            }
        }

        // 2. Quét các hóa đơn quá hạn (due_date < today) mà chưa thanh toán
        const { data: overdueInvoices, error: invoicesError } = await supabaseAdmin
            .from('invoices')
            .select('id, org_id, title, due_date, room:rooms(name)')
            .in('status', ['unpaid', 'partial'])
            .lt('due_date', today);

        if (invoicesError) {
            console.error('Error fetching overdue invoices:', invoicesError);
        } else if (overdueInvoices && overdueInvoices.length > 0) {
            // Lọc các reminder đã tồn tại cho hoá đơn này
            const invoiceIds = overdueInvoices.map(i => i.id);
            const { data: existingInvoiceReminders } = await supabaseAdmin
                .from('reminders')
                .select('entity_id')
                .eq('entity_type', 'invoice')
                .in('entity_id', invoiceIds);

            const existingIds = new Set(existingInvoiceReminders?.map(r => r.entity_id) || []);
            const newInvoices = overdueInvoices.filter(i => !existingIds.has(i.id));

            if (newInvoices.length > 0) {
                const invoiceReminders = newInvoices.map(i => ({
                    org_id: i.org_id,
                    entity_type: 'invoice',
                    entity_id: i.id,
                    message: `Hóa đơn "${i.title}" (phòng ${(i.room as { name?: string })?.name || ''}) đã quá hạn thanh toán từ ngày ${dayjs(i.due_date).format('DD/MM/YYYY')}.`,
                    due_date: i.due_date,
                    is_read: false
                }));

                await supabaseAdmin.from('reminders').insert(invoiceReminders);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${expiringContracts?.length || 0} contracts and ${overdueInvoices?.length || 0} invoices.`,
        });
    } catch (error: unknown) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
