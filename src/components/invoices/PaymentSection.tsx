'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, message, Alert, Divider } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import type { Invoice, PaymentSettingsFormData } from '@/types/database';


interface PaymentSectionProps {
    invoice: Partial<Invoice> & { id: string, total_amount: number | string, paid_amount: number | string };
    paymentSettings?: PaymentSettingsFormData | null;
    hasPayosConfig: boolean;
}

export default function PaymentSection({ invoice, paymentSettings, hasPayosConfig }: PaymentSectionProps) {
    const [loadingPayos, setLoadingPayos] = useState(false);

    const remaining = Number(invoice.total_amount) - Number(invoice.paid_amount);

    if (remaining <= 0) {
        return (
            <Alert 
                message="Hoá đơn đã được thanh toán đầy đủ" 
                type="success" 
                showIcon 
                className="mt-6"
            />
        );
    }

    const handlePayosCheckout = async () => {
        setLoadingPayos(true);
        try {
            const res = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId: invoice.id })
            });
            const data = await res.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error(data.error || 'Lỗi tạo link thanh toán PayOS');
            }
        } catch (error: unknown) {
            console.error('PayOS Checkout Error:', error);
            message.error(error instanceof Error ? error.message : 'Không thể kết nối với PayOS');
        } finally {
            setLoadingPayos(false);
        }
    };

    // VietQR URL format: https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
    const qrUrl = paymentSettings 
        ? `https://img.vietqr.io/image/${paymentSettings.bank_bin}-${paymentSettings.bank_account}-compact2.png?amount=${remaining}&addInfo=Thanh toan HD ${invoice.id.split('-')[0]}&accountName=${paymentSettings.account_name}` 
        : null;

    return (
        <Card title="Phương thức thanh toán" className="mt-6 shadow-sm border-blue-100" headStyle={{ backgroundColor: '#f0f8ff' }}>
            {hasPayosConfig ? (
                <div className="text-center py-6">
                    <Typography.Title level={5} className="mb-4">Thanh toán tự động 24/7 (Khuyên dùng)</Typography.Title>
                    <Typography.Text type="secondary" className="block mb-6">
                        Thanh toán qua cổng PayOS. Hệ thống sẽ tự động xác nhận hoá đơn ngay lập tức sau khi chuyển khoản thành công.
                    </Typography.Text>
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<CreditCardOutlined />} 
                        loading={loadingPayos}
                        onClick={handlePayosCheckout}
                        className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg"
                    >
                        Thanh toán ngay ({remaining.toLocaleString()} đ)
                    </Button>
                </div>
            ) : paymentSettings ? (
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                    <div className="flex-1 text-center md:text-left">
                        <Typography.Title level={5}>Chuyển khoản Ngân hàng (VietQR)</Typography.Title>
                        <Typography.Text className="block mt-2 text-slate-500">
                            Quý khách vui lòng quét mã QR bằng ứng dụng ngân hàng. Nội dung và số tiền đã được điền sẵn.
                        </Typography.Text>
                        <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex justify-between mb-2">
                                <Typography.Text type="secondary">Ngân hàng:</Typography.Text>
                                <Typography.Text strong>{paymentSettings.bank_name}</Typography.Text>
                            </div>
                            <div className="flex justify-between mb-2">
                                <Typography.Text type="secondary">Số tài khoản:</Typography.Text>
                                <Typography.Text strong className="text-lg text-blue-600">{paymentSettings.bank_account}</Typography.Text>
                            </div>
                            <div className="flex justify-between mb-2">
                                <Typography.Text type="secondary">Chủ tài khoản:</Typography.Text>
                                <Typography.Text strong>{paymentSettings.account_name}</Typography.Text>
                            </div>
                            <div className="flex justify-between">
                                <Typography.Text type="secondary">Số tiền:</Typography.Text>
                                <Typography.Text strong className="text-lg text-red-500">{remaining.toLocaleString()} đ</Typography.Text>
                            </div>
                            <Divider className="my-3" />
                            <div className="flex justify-between">
                                <Typography.Text type="secondary">Nội dung CK:</Typography.Text>
                                <Typography.Text strong className="bg-yellow-100 px-2 py-1 rounded">Thanh toan HD {invoice.id.split('-')[0]}</Typography.Text>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={qrUrl!} 
                            alt="VietQR" 
                            className="w-64 h-64 object-contain"
                            loading="lazy"
                        />
                        <div className="text-center mt-2 text-xs text-slate-400">
                            Cung cấp bởi VietQR
                        </div>
                    </div>
                </div>
            ) : (
                <Alert 
                    message="Chưa cấu hình thanh toán" 
                    description="Chủ nhà chưa thiết lập thông tin ngân hàng hoặc cổng thanh toán. Vui lòng liên hệ trực tiếp để thanh toán." 
                    type="warning" 
                    showIcon 
                />
            )}
        </Card>
    );
}
