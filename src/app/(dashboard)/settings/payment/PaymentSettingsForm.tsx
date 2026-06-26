'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message, Alert, Card, Typography } from 'antd';
import { updatePaymentSettings } from './actions';
import type { PaymentSettingsFormData } from '@/types/database';


interface Bank {
    id: number;
    name: string;
    code: string;
    bin: string;
    shortName: string;
    logo: string;
}

export default function PaymentSettingsForm({ initialData }: { initialData?: Partial<PaymentSettingsFormData> | null }) {
    const [form] = Form.useForm();
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch banks from VietQR API
        fetch('https://api.vietqr.io/v2/banks')
            .then(res => res.json())
            .then(data => {
                if (data.code === '00') {
                    setBanks(data.data);
                }
            })
            .catch(err => {
                console.error('Failed to fetch banks', err);
                message.error('Không thể tải danh sách ngân hàng');
            })
            .finally(() => setLoadingBanks(false));
    }, []);

    const onFinish = async (values: { bank_bin: string; bank_account: string; account_name: string; payos_client_id?: string; payos_api_key?: string; payos_checksum_key?: string }) => {
        setSaving(true);
        try {
            // Find selected bank to get exact names
            const selectedBank = banks.find(b => b.bin === values.bank_bin);
            
            const payload: PaymentSettingsFormData = {
                bank_bin: values.bank_bin,
                bank_name: selectedBank ? `${selectedBank.shortName} - ${selectedBank.name}` : values.bank_bin,
                bank_account: values.bank_account,
                account_name: values.account_name.toUpperCase(),
                payos_client_id: values.payos_client_id,
                payos_api_key: values.payos_api_key,
                payos_checksum_key: values.payos_checksum_key,
            };

            const res = await updatePaymentSettings(payload);
            if (res.error) {
                message.error(res.error);
            } else {
                message.success('Đã cập nhật thông tin thanh toán thành công!');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto shadow-sm border-slate-200">
            <div className="mb-6">
                <Typography.Title level={4}>Cấu hình Thanh toán VietQR</Typography.Title>
                <Typography.Text className="text-slate-500">
                    Hệ thống sẽ tự động tạo mã QR trên mỗi hoá đơn dựa vào thông tin ngân hàng của bạn.
                </Typography.Text>
            </div>

            <Alert
                message="Lưu ý quan trọng"
                description="Tên chủ tài khoản phải khớp chính xác với thẻ ngân hàng (viết không dấu). Mã QR không thể tự động xác nhận hoá đơn, bạn cần xác nhận thu tiền thủ công sau khi khách chuyển khoản."
                type="info"
                showIcon
                className="mb-6 bg-blue-50 border-blue-200 text-blue-800"
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={initialData ? {
                    bank_bin: initialData.bank_bin,
                    bank_account: initialData.bank_account,
                    account_name: initialData.account_name,
                    payos_client_id: initialData.payos_client_id,
                    payos_api_key: initialData.payos_api_key,
                    payos_checksum_key: initialData.payos_checksum_key,
                } : {}}
            >
                <Form.Item
                    label="Ngân hàng"
                    name="bank_bin"
                    rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
                >
                    <Select
                        showSearch
                        placeholder="Chọn ngân hàng"
                        loading={loadingBanks}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                        }
                        options={banks.map(bank => ({
                            value: bank.bin,
                            label: `${bank.shortName} - ${bank.name}`,
                        }))}
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    label="Số tài khoản"
                    name="bank_account"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số tài khoản' },
                        { pattern: /^[0-9A-Za-z]+$/, message: 'Số tài khoản không hợp lệ' }
                    ]}
                >
                    <Input placeholder="Ví dụ: 1903123456789" size="large" />
                </Form.Item>

                <Form.Item
                    label="Tên chủ tài khoản"
                    name="account_name"
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên chủ tài khoản' }
                    ]}
                    extra="Viết in hoa không dấu, ví dụ: NGUYEN VAN A"
                >
                    <Input 
                        placeholder="Ví dụ: NGUYEN VAN A" 
                        size="large" 
                        onChange={(e) => form.setFieldsValue({ account_name: e.target.value.toUpperCase() })}
                    />
                </Form.Item>

                <div className="mt-8 mb-4">
                    <Typography.Title level={5}>Tích hợp PayOS (Tùy chọn nâng cao)</Typography.Title>
                    <Typography.Text className="text-slate-500 block mb-4">
                        Nhập thông tin API từ tài khoản PayOS của bạn để bật tính năng Thanh toán tự động. Nếu để trống, hệ thống sẽ chỉ dùng mã VietQR tĩnh.
                        <br/>
                        <strong>Quan trọng:</strong> Đảm bảo bạn đã dán Webhook URL vào PayOS Dashboard. URL của hệ thống này là: <code>https://&lt;domain-cua-ban&gt;/api/payment/webhook</code>
                    </Typography.Text>
                </div>

                <Form.Item
                    label="Client ID"
                    name="payos_client_id"
                >
                    <Input placeholder="Nhập Client ID từ PayOS" size="large" />
                </Form.Item>

                <Form.Item
                    label="API Key"
                    name="payos_api_key"
                >
                    <Input.Password placeholder="Nhập API Key" size="large" />
                </Form.Item>

                <Form.Item
                    label="Checksum Key"
                    name="payos_checksum_key"
                >
                    <Input.Password placeholder="Nhập Checksum Key" size="large" />
                </Form.Item>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        size="large" 
                        loading={saving}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        Lưu cấu hình
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
