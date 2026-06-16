'use client';

import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { UserOutlined, LockOutlined } from '@ant-design/icons';


export default function TenantLoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onFinish = async (values: { phone: string; access_code: string }) => {
        setLoading(true);
        try {
            const res = await fetch('/api/tenant/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Đăng nhập thất bại');
            }

            message.success('Đăng nhập thành công');
            router.push('/portal/dashboard');
            router.refresh();
        } catch (error: unknown) {
            message.error(error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <Typography.Title level={3} className="!mb-1">RentFlow Portal</Typography.Title>
                    <Typography.Text type="secondary">Dành cho Khách Thuê</Typography.Text>
                </div>

                <Form
                    name="tenant_login"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="phone"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại!' },
                        ]}
                    >
                        <Input 
                            prefix={<UserOutlined className="text-gray-400" />} 
                            placeholder="Số điện thoại" 
                        />
                    </Form.Item>

                    <Form.Item
                        name="access_code"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã PIN!' },
                            { len: 6, message: 'Mã PIN phải gồm 6 ký tự' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Mã PIN (6 số)"
                            maxLength={6}
                        />
                    </Form.Item>

                    <Form.Item className="mt-8 mb-0">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            className="w-full"
                            loading={loading}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            </div>
            
            <div className="mt-8 text-center text-gray-500 text-sm">
                Nếu bạn chưa có mã PIN, vui lòng liên hệ Chủ nhà để được cấp mã.
            </div>
        </div>
    );
}
