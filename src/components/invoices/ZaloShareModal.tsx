'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Spin, Typography, message, Space, Alert, Segmented } from 'antd';
import { CopyOutlined, CheckOutlined, MessageOutlined, QrcodeOutlined, ExportOutlined } from '@ant-design/icons';
import { getZaloInvoiceMessage } from '@/app/(dashboard)/invoices/actions';

interface Props {
    open: boolean;
    onClose: () => void;
    invoiceId: string;
    invoiceTitle?: string;
}

export default function ZaloShareModal({ open, onClose, invoiceId, invoiceTitle }: Props) {
    const [loading, setLoading] = useState(false);
    const [templateType, setTemplateType] = useState<'invoice' | 'reminder'>('invoice');
    const [invoiceMsg, setInvoiceMsg] = useState('');
    const [reminderMsg, setReminderMsg] = useState('');
    const [content, setContent] = useState('');
    const [vietQrUrl, setVietQrUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [phone, setPhone] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !invoiceId) return;

        let isMounted = true;
        setLoading(true);
        setCopied(false);
        setTemplateType('invoice');

        getZaloInvoiceMessage(invoiceId)
            .then((res) => {
                if (!isMounted) return;
                if (res.success && res.message) {
                    const inv = res.message;
                    const rem = res.reminderMessage || res.message;
                    setInvoiceMsg(inv);
                    setReminderMsg(rem);
                    setContent(inv);
                    setVietQrUrl(res.vietQrUrl || '');
                    setPhone(res.tenantPhone || null);
                } else {
                    message.error(res.error || 'Không thể tạo nội dung tin nhắn');
                }
            })
            .catch((err) => {
                if (isMounted) {
                    message.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [open, invoiceId]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            message.success('Đã sao chép nội dung tin nhắn gửi Zalo!');
            setTimeout(() => setCopied(false), 3000);
        } catch {
            message.warning('Vui lòng bôi đen văn bản bên dưới và bấm Ctrl+C để sao chép.');
        }
    };

    const handleOpenZalo = () => {
        // Nếu có số điện thoại khách, mở chat Zalo theo link zalo.me/{phone}
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://zalo.me/${cleanPhone}`, '_blank');
        } else {
            window.open('https://chat.zalo.me/', '_blank');
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <MessageOutlined style={{ color: '#0068ff', fontSize: 20 }} />
                    <span>Gửi Hóa Đơn Qua Zalo {invoiceTitle ? `(${invoiceTitle})` : ''}</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            width={640}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>,
                <Button
                    key="open-zalo"
                    icon={<ExportOutlined />}
                    onClick={handleOpenZalo}
                >
                    {phone ? `Mở Zalo (${phone})` : 'Mở Zalo Web'}
                </Button>,
                <Button
                    key="copy"
                    type="primary"
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={handleCopy}
                    style={{ backgroundColor: copied ? '#10b981' : '#0068ff' }}
                >
                    {copied ? 'Đã sao chép' : 'Sao chép tin nhắn'}
                </Button>,
            ]}
        >
            {loading ? (
                <div className="py-12 text-center">
                    <Spin size="large" />
                    <div className="mt-3 text-slate-500 text-sm">Đang tạo nội dung hóa đơn và mã VietQR...</div>
                </div>
            ) : (
                <div className="space-y-4">
                    <Segmented
                        value={templateType}
                        onChange={(val) => {
                            const next = val as 'invoice' | 'reminder';
                            setTemplateType(next);
                            setContent(next === 'invoice' ? invoiceMsg : reminderMsg);
                        }}
                        options={[
                            { label: 'Hóa đơn chi tiết', value: 'invoice' },
                            { label: 'Nhắc nợ / Nhắc thanh toán', value: 'reminder' },
                        ]}
                        block
                    />

                    {templateType === 'invoice' ? (
                        <Alert
                            type="info"
                            showIcon
                            message="Tin nhắn đã tích hợp đầy đủ chi tiết điện, nước, dịch vụ và link mã VietQR động để khách quét thanh toán nhanh."
                        />
                    ) : (
                        <Alert
                            type="warning"
                            showIcon
                            message="Mẫu tin nhắn nhắc nhở lịch sự dành cho khách chưa thanh toán hoặc quá hạn, đính kèm link mã VietQR động đúng số tiền nợ còn lại."
                        />
                    )}

                    <div>
                        <Typography.Text strong className="block mb-1">
                            Nội dung tin nhắn (Có thể chỉnh sửa trước khi sao chép):
                        </Typography.Text>
                        <Input.TextArea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={12}
                            className="font-mono text-xs leading-relaxed"
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {vietQrUrl && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <QrcodeOutlined style={{ fontSize: 24, color: '#0284c7' }} />
                                <div>
                                    <div className="text-xs font-semibold text-slate-800">Mã VietQR động đính kèm:</div>
                                    <div className="text-[11px] text-slate-500 truncate max-w-[340px]">{vietQrUrl}</div>
                                </div>
                            </div>
                            <Button
                                size="small"
                                type="link"
                                href={vietQrUrl}
                                target="_blank"
                            >
                                Xem mã QR
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
