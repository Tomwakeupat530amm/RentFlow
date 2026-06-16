'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, notification, Typography, Alert, Tabs, Divider } from 'antd';
import { payInvoice } from '@/app/(dashboard)/invoices/actions';
import type { Invoice } from '@/types/database';

interface Props {
    invoice: Invoice | null;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PaymentModal({ invoice, open, onClose, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const remaining = invoice ? Number(invoice.total_amount) - Number(invoice.paid_amount) : 0;

    useEffect(() => {
        if (open && invoice) {
            form.setFieldsValue({
                amount: remaining > 0 ? remaining : 0
            });
        } else {
            form.resetFields();
        }
    }, [open, invoice, form, remaining]);

    const handleSubmit = async (values: { amount: number }) => {
        if (!invoice) return;
        setLoading(true);
        const { error } = await payInvoice(invoice.id, values.amount);

        if (error) {
            notification.error({ message: 'Lỗi cập nhật', description: error });
            setLoading(false);
        } else {
            notification.success({ message: 'Thành công', description: 'Đã cập nhật thanh toán' });
            setLoading(false);
            form.resetFields();
            onSuccess();
            onClose();
        }
    };

    if (!invoice) return null;

    return (
        <Modal
            title="Ghi Nhận Thanh Toán"
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText="Lưu Thanh Toán"
            cancelText="Huỷ"
            destroyOnHidden
        >
            <div className="mb-6 mt-4">
                <Alert
                    type="info"
                    message={
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                                <span>Tổng tiền hoá đơn:</span>
                                <Typography.Text strong>{Number(invoice.total_amount).toLocaleString()} đ</Typography.Text>
                            </div>
                            <div className="flex justify-between">
                                <span>Đã thanh toán:</span>
                                <Typography.Text type="success" strong>{Number(invoice.paid_amount).toLocaleString()} đ</Typography.Text>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-blue-200">
                                <span>Cần thanh toán thêm:</span>
                                <Typography.Text type="danger" strong>{remaining.toLocaleString()} đ</Typography.Text>
                            </div>
                        </div>
                    }
                />
            </div>
            <Tabs
                defaultActiveKey="qr"
                items={[
                    {
                        key: 'qr',
                        label: 'Quét mã VietQR',
                        children: (
                            <div className="flex flex-col items-center justify-center p-4">
                                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={`https://img.vietqr.io/image/970436-0123456789-compact2.jpg?amount=${remaining}&addInfo=${invoice.id}&accountName=RENTFLOW`} 
                                        alt="VietQR" 
                                        className="w-64 h-64 object-contain"
                                    />
                                </div>
                                <Typography.Text type="secondary" className="text-center">
                                    Quét mã bằng ứng dụng ngân hàng.<br />Hệ thống tự động ghi nhận sau 5-10 giây.
                                </Typography.Text>
                            </div>
                        )
                    },
                    {
                        key: 'manual',
                        label: 'Nhập thủ công',
                        children: (
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSubmit}
                                className="mt-4"
                            >
                                <Form.Item
                                    name="amount"
                                    label="Số tiền khách trả đợt này (VNĐ)"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số tiền' },
                                        { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' }
                                    ]}
                                >
                                    <InputNumber
                                        className="w-full text-lg font-bold"
                                        size="large"
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => Number(value?.toString().replace(/\$\s?|(,*)/g, '') || 0)}
                                        addonAfter="VNĐ"
                                    />
                                </Form.Item>
                                <Divider />
                                <Typography.Text type="secondary" className="text-sm">
                                    Dùng tính năng này khi khách hàng thanh toán bằng tiền mặt hoặc khi hệ thống webhook bị chậm trễ.
                                </Typography.Text>
                            </Form>
                        )
                    }
                ]}
            />
        </Modal>
    );
}
