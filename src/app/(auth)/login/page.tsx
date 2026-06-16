'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Typography, Checkbox, Divider, App } from 'antd';
import { LockOutlined, MailOutlined, GoogleOutlined, HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginWithEmail, loginWithGoogle } from '../actions';


export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();
    const router = useRouter();

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('email', values.email);
        formData.append('password', values.password);

        const result = await loginWithEmail(formData);
        if (result?.error) {
            message.error(result.error);
            setLoading(false);
        } else if (result?.success) {
            // refresh() clears Next.js router cache so the new session cookie
            // is picked up before navigating to the protected route
            router.refresh();
            router.push('/dashboard');
        }
    };

    const handleGoogleLogin = async () => {
        const result = await loginWithGoogle();
        if (result?.error) {
            message.error(result.error);
        }
    };


    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                background: '#f0f2f5',
            }}
        >
            {/* Left — Branding Panel */}
            <div
                style={{
                    flex: '0 0 480px',
                    background: 'linear-gradient(160deg, #0f172a 0%, #134e4a 60%, #0d9488 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '64px 48px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                className="hidden lg:flex"
            >
                {/* Decorative circles */}
                <div
                    style={{
                        position: 'absolute',
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.06)',
                        top: -100,
                        right: -100,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.04)',
                        bottom: -50,
                        left: -80,
                    }}
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 26,
                            fontWeight: 800,
                            color: '#5eead4',
                            marginBottom: 32,
                        }}
                    >
                        <HomeOutlined />
                    </div>
                    <h2 style={{ color: 'white', fontSize: 32, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                        Quản lý phòng trọ
                        <br />
                        <span style={{ color: '#5eead4' }}>thông minh.</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 16, lineHeight: 1.7, maxWidth: 360 }}>
                        Giảm 70% thời gian tạo hoá đơn. Quản lý điện nước, thu tiền, hợp đồng — tất cả trong một nền tảng duy nhất.
                    </p>

                    <div style={{ marginTop: 40, display: 'flex', gap: 32 }}>
                        {[
                            { num: '150+', label: 'Phòng quản lý' },
                            { num: '~0', label: 'Lỗi thu tiền' },
                            { num: '70%', label: 'Tiết kiệm thời gian' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div style={{ color: '#5eead4', fontSize: 24, fontWeight: 800 }}>{item.num}</div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — Login Form */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '48px 24px',
                }}
            >
                <div style={{ width: '100%', maxWidth: 400 }}>
                    {/* Mobile Logo */}
                    <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 22,
                                fontWeight: 800,
                                color: 'white',
                                marginBottom: 12,
                            }}
                        >
                            <HomeOutlined />
                        </div>
                        <Typography.Title level={4} style={{ margin: 0 }}>RentFlow</Typography.Title>
                    </div>

                    <Typography.Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                        Đăng nhập
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 32, marginTop: 4 }}>
                        Chào mừng trở lại! Hãy đăng nhập để tiếp tục.
                    </Typography.Text>

                    {/* Google Login */}
                    <Button
                        block
                        size="large"
                        icon={<GoogleOutlined />}
                        onClick={handleGoogleLogin}
                        style={{ height: 44, fontWeight: 500, marginBottom: 16 }}
                    >
                        Tiếp tục với Google
                    </Button>

                    <Divider style={{ margin: '16px 0', color: '#94a3b8', fontSize: 13 }}>
                        hoặc dùng Email
                    </Divider>

                    <Form
                        name="login"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="email"
                            label={<span style={{ fontWeight: 500 }}>Email</span>}
                            rules={[
                                { required: true, message: 'Vui lòng nhập Email!' },
                                { type: 'email', message: 'Email không hợp lệ!' },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="admin@example.com"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="••••••••"
                            />
                        </Form.Item>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                            </Form.Item>
                            <Link href="#" style={{ color: '#0d9488', fontWeight: 500, fontSize: 13 }}>
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                style={{ height: 44, fontWeight: 600, fontSize: 15 }}
                            >
                                Đăng nhập
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider style={{ margin: '16px 0', color: '#94a3b8', fontSize: 13 }}>
                        Chưa có tài khoản?
                    </Divider>

                    <Link href="/register" style={{ display: 'block' }}>
                        <Button block size="large" style={{ height: 44, fontWeight: 600 }}>
                            Đăng ký tài khoản mới
                        </Button>
                    </Link>

                    <div style={{ textAlign: 'center', marginTop: 32, color: '#94a3b8', fontSize: 12 }}>
                        © 2025 RentFlow. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
