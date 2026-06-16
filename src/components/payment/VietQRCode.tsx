'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, message, Button, Space, Tag } from 'antd';
import { CopyOutlined, QrcodeOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface Props {
    bankBin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    invoiceId?: string;
}

/**
 * VietQR Generator Component
 * Uses VietQR.io API to generate QR codes for bank transfers
 */
export default function VietQRCode({
    bankBin,
    accountNumber,
    accountName,
    amount,
    description,
    invoiceId,
}: Props) {
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (bankBin && accountNumber && amount > 0) {
            // VietQR Quick Link format
            const url = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
            setQrUrl(url);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [bankBin, accountNumber, amount, description, accountName]);

    const handleCopyInfo = () => {
        const info = `Ngân hàng: ${bankBin}\nSố TK: ${accountNumber}\nChủ TK: ${accountName}\nSố tiền: ${amount.toLocaleString('vi-VN')} VNĐ\nNội dung: ${description}`;
        navigator.clipboard.writeText(info);
        setCopied(true);
        message.success('Đã sao chép thông tin chuyển khoản');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!bankBin || !accountNumber) {
        return (
            <Card style={{ borderRadius: 12, textAlign: 'center', padding: 24 }}>
                <QrcodeOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div style={{ marginTop: 12 }}>
                    <Text type="secondary">
                        Chưa cấu hình thông tin ngân hàng.
                        <br />
                        Vui lòng cập nhật trong <strong>Cài đặt &gt; Tổ chức</strong>.
                    </Text>
                </div>
            </Card>
        );
    }

    return (
        <Card
            style={{
                borderRadius: 12,
                textAlign: 'center',
                border: '1px solid #d9f7be',
                background: 'linear-gradient(180deg, #f6ffed 0%, #fff 40%)',
            }}
        >
            <Title level={5} style={{ marginBottom: 16 }}>
                <QrcodeOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Quét QR để thanh toán
            </Title>

            {loading ? (
                <Spin size="large" />
            ) : qrUrl ? (
                <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={qrUrl}
                        alt="VietQR Payment"
                        style={{
                            width: 220,
                            height: 220,
                            margin: '0 auto',
                            borderRadius: 12,
                            border: '2px solid #f0f0f0',
                        }}
                    />

                    <div style={{ marginTop: 16, textAlign: 'left', padding: '0 12px' }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Chủ TK:</Text>
                                <Text strong>{accountName}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Số TK:</Text>
                                <Text strong style={{ fontFamily: 'monospace' }}>{accountNumber}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Số tiền:</Text>
                                <Text strong style={{ color: '#cf1322' }}>
                                    {amount.toLocaleString('vi-VN')} VNĐ
                                </Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Nội dung:</Text>
                                <Text style={{ fontSize: 12, maxWidth: 160 }} ellipsis>{description}</Text>
                            </div>
                            {invoiceId && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Mã HĐ:</Text>
                                    <Tag color="blue" style={{ fontSize: 11 }}>{invoiceId.slice(0, 8)}</Tag>
                                </div>
                            )}
                        </Space>
                    </div>

                    <Button
                        icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                        onClick={handleCopyInfo}
                        style={{ marginTop: 12 }}
                        type={copied ? 'primary' : 'default'}
                    >
                        {copied ? 'Đã sao chép' : 'Sao chép thông tin CK'}
                    </Button>
                </div>
            ) : (
                <Text type="secondary">Không thể tạo mã QR. Kiểm tra thông tin ngân hàng.</Text>
            )}
        </Card>
    );
}
