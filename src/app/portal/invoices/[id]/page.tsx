export const dynamic = 'force-dynamic';
/* eslint-disable */
// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { Typography, Card, Divider, Button, Tag } from 'antd';
import { ArrowLeftOutlined, QrcodeOutlined } from '@ant-design/icons';
import Link from 'next/link';


export default async function PortalInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getTenantSession();
    if (!session || !session.room_id) return null;

    const supabase = createAdminClient();

    const { data: invoice } = await supabase
        .from('invoices')
        .select(`
            *,
            rooms (name),
            invoice_items (*)
        `)
        .eq('id', id)
        .eq('room_id', session.room_id)
        .single();

    if (!invoice) return <div className="p-4">Không tìm thấy hoá đơn.</div>;

    // Lấy thông tin thanh toán cấu hình của chủ nhà (tổ chức)
    const { data: paymentSettings } = await supabase
        .from('payment_settings')
        .select('bank_bin, bank_account, account_name, qr_template')
        .eq('org_id', invoice.org_id)
        .maybeSingle();

    const bankBin = paymentSettings?.bank_bin || '970415';
    const bankAccount = paymentSettings?.bank_account || '113366668888';
    const accountName = paymentSettings?.account_name || 'RENTFLOW HOST';
    const qrTemplate = paymentSettings?.qr_template || 'compact2';

    const remainingAmount = Math.max(0, Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0));
    const transferContent = invoice.order_code ? `RF ${invoice.order_code}` : `HD ${invoice.id.substring(0, 6).toUpperCase()}`;

    const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-${qrTemplate}.png?amount=${remainingAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    return (
        <div className="p-4 space-y-4 pb-20">
            <div className="flex items-center space-x-2 mb-4">
                <Link href="/portal/invoices">
                    <Button type="text" icon={<ArrowLeftOutlined />} />
                </Link>
                <Typography.Title level={4} className="!mb-0">Chi tiết hoá đơn</Typography.Title>
            </div>

            <Card className="shadow-sm">
                <div className="text-center mb-6">
                    <Typography.Title level={3} className="text-blue-600">
                        {invoice.total_amount?.toLocaleString()} đ
                    </Typography.Title>
                    <div>
                        {invoice.status === 'paid' ? (
                            <Tag color="success" className="text-base px-4 py-1">Đã thanh toán</Tag>
                        ) : (
                            <Tag color="error" className="text-base px-4 py-1">Chưa thanh toán</Tag>
                        )}
                    </div>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <Typography.Text type="secondary">Phòng</Typography.Text>
                        <Typography.Text strong>{invoice.rooms?.name}</Typography.Text>
                    </div>
                    <div className="flex justify-between">
                        <Typography.Text type="secondary">Ngày tạo</Typography.Text>
                        <Typography.Text strong>{new Date(invoice.created_at).toLocaleDateString('vi-VN')}</Typography.Text>
                    </div>
                    <div className="flex justify-between">
                        <Typography.Text type="secondary">Hạn chót</Typography.Text>
                        <Typography.Text strong>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('vi-VN') : 'Không'}</Typography.Text>
                    </div>
                </div>

                <Divider dashed />

                <div className="space-y-3">
                    <Typography.Text strong>Chi tiết các khoản phí</Typography.Text>
                    {invoice.invoice_items && invoice.invoice_items.map((item: { id: string, description: string, amount: number }) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <Typography.Text>{item.description || 'Phí'}</Typography.Text>
                            <Typography.Text>{item.amount?.toLocaleString()} đ</Typography.Text>
                        </div>
                    ))}
                </div>
            </Card>

            {invoice.status !== 'paid' && (
                <Card className="shadow-sm text-center border-blue-200 bg-blue-50">
                    <Typography.Title level={5}>Thanh toán quét mã QR</Typography.Title>
                    <Typography.Text type="secondary" className="block mb-4 text-xs">
                        Sử dụng App ngân hàng để quét mã này. Hệ thống sẽ tự động gạch nợ sau 1-2 phút.
                    </Typography.Text>
                    
                    <div className="bg-white p-2 rounded-xl inline-block shadow-sm">
                        {/* We use standard img to avoid Next.js Image host configuration issues for external domains */}
                        <img 
                            src={vietQrUrl} 
                            alt="VietQR Code" 
                            className="w-48 h-48 object-contain"
                        />
                    </div>

                    <div className="mt-4 p-3 bg-white rounded-lg text-left text-xs space-y-1 text-slate-700 border border-slate-100">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Số tài khoản:</span>
                            <span className="font-mono font-semibold">{bankAccount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Chủ tài khoản:</span>
                            <span className="font-semibold uppercase">{accountName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Số tiền:</span>
                            <span className="font-semibold text-blue-600">{remainingAmount.toLocaleString()} đ</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Nội dung CK:</span>
                            <span className="font-mono font-bold text-red-600">{invoice.order_code ? `RF ${invoice.order_code}` : `HD ${invoice.id.substring(0, 6).toUpperCase()}`}</span>
                        </div>
                    </div>
                    
                    <Button 
                        type="primary" 
                        icon={<QrcodeOutlined />} 
                        className="w-full mt-4" 
                        size="large"
                    >
                        Tôi đã chuyển khoản
                    </Button>
                </Card>
            )}
        </div>
    );
}
