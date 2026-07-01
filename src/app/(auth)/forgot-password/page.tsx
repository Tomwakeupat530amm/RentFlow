'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { requestPasswordReset } from '../actions';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { message } = App.useApp();

    const onFinish = async (values: { email: string }) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('email', values.email);

        const result = await requestPasswordReset(formData);
        
        if (result?.error) {
            message.error(result.error);
        } else if (result?.success) {
            setIsSuccess(true);
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: 24,
        }}>
            <div style={{
                background: '#fff',
                padding: '40px 48px',
                borderRadius: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                width: '100%',
                maxWidth: 480,
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        background: '#e6f4ff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <MailOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                    </div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                        Quên mật khẩu
                    </Title>
                    <Text style={{ color: '#64748b', fontSize: 15, display: 'block', marginTop: 8 }}>
                        Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                    </Text>
                </div>

                {isSuccess ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            padding: '16px 24px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 8,
                            marginBottom: 24
                        }}>
                            <Text style={{ color: '#166534', fontSize: 15 }}>
                                Chúng tôi đã gửi một email có chứa liên kết khôi phục mật khẩu. Vui lòng kiểm tra hộp thư của bạn.
                            </Text>
                        </div>
                        <Link href="/login">
                            <Button type="primary" block style={{ height: 44, fontWeight: 600, fontSize: 15 }}>
                                Trở về đăng nhập
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <Form layout="vertical" onFinish={onFinish} size="large">
                        <Form.Item
                            name="email"
                            label={<span style={{ fontWeight: 500 }}>Email</span>}
                            rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: 'email', message: 'Email không hợp lệ!' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="name@example.com"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginTop: 32, marginBottom: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                style={{ height: 44, fontWeight: 600, fontSize: 15 }}
                            >
                                Gửi liên kết
                            </Button>
                        </Form.Item>
                        
                        <div style={{ textAlign: 'center' }}>
                            <Link href="/login" style={{ color: '#64748b', fontWeight: 500, fontSize: 14 }}>
                                <ArrowLeftOutlined style={{ marginRight: 6 }} /> Quay lại đăng nhập
                            </Link>
                        </div>
                    </Form>
                )}
            </div>
        </div>
    );
}
