'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Typography, Divider, Radio, Space, App } from 'antd';
import {
    LockOutlined,
    MailOutlined,
    UserOutlined,
    TeamOutlined,
    KeyOutlined,
    GoogleOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { registerAndCreateOrg, registerAndJoinOrg, loginWithGoogle } from '../actions';

const { Title, Text } = Typography;

type RegisterMode = 'create' | 'join';

export default function RegisterPage() {
    const [mode, setMode] = useState<RegisterMode>('create');
    const [loading, setLoading] = useState(false);
    const { message, modal } = App.useApp();

    const onFinish = async (values: Record<string, string>) => {
        setLoading(true);

        const formData = new FormData();
        formData.append('email', values.email);
        formData.append('password', values.password);
        formData.append('fullName', values.fullName);

        let result;

        if (mode === 'create') {
            formData.append('orgName', values.orgName);
            result = await registerAndCreateOrg(formData);
        } else {
            formData.append('inviteCode', values.inviteCode);
            result = await registerAndJoinOrg(formData);
        }

        setLoading(false);

        if (result?.error) {
            message.error(result.error);
        } else if (result && 'success' in result && result.success) {
            const orgName = result.orgName;
            modal.success({
                title: 'Đăng ký thành công! 🎉',
                content: (
                    <div style={{ paddingTop: 8 }}>
                        <p style={{ margin: 0, fontSize: 15 }}>
                            {mode === 'create'
                                ? <>Tạo tổ chức <strong>&ldquo;{orgName}&rdquo;</strong> thành công!</>
                                : <>Đã tham gia tổ chức <strong>&ldquo;{orgName}&rdquo;</strong> thành công!</>}
                        </p>
                        <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: 14 }}>
                            📧 Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập để bắt đầu.
                        </p>
                    </div>
                ),
                okText: 'Đến trang đăng nhập',
                centered: true,
                onOk: () => { window.location.href = '/login'; },
            });
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
                        Bắt đầu
                        <br />
                        <span style={{ color: '#5eead4' }}>ngay hôm nay.</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 16, lineHeight: 1.7, maxWidth: 360 }}>
                        Tạo tổ chức mới hoặc tham gia tổ chức có sẵn bằng mã mời. Thiết lập chỉ mất 2 phút.
                    </p>

                    <div
                        style={{
                            marginTop: 32,
                            padding: '20px 24px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                            Bước đăng ký
                        </div>
                        {['Tạo tài khoản', 'Tạo / Tham gia tổ chức', 'Bắt đầu quản lý!'].map((step, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: i > 0 ? 10 : 0 }}>
                                <div
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: i === 0 ? '#5eead4' : 'rgba(255,255,255,0.1)',
                                        color: i === 0 ? '#0f172a' : 'rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <span style={{ color: i === 0 ? '#5eead4' : 'rgba(255,255,255,0.5)', fontSize: 14 }}>{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — Register Form */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '48px 24px',
                    overflowY: 'auto',
                }}
            >
                <div style={{ width: '100%', maxWidth: 420 }}>
                    {/* Mobile Logo */}
                    <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 24 }}>
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
                        <Title level={4} style={{ margin: 0 }}>RentFlow</Title>
                    </div>

                    <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                        Tạo tài khoản
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24, marginTop: 4 }}>
                        Đăng ký miễn phí để bắt đầu quản lý phòng trọ.
                    </Text>



                    {/* Google Signup */}
                    <Button
                        block
                        size="large"
                        icon={<GoogleOutlined />}
                        onClick={handleGoogleLogin}
                        style={{ height: 44, fontWeight: 500, marginBottom: 16 }}
                    >
                        Đăng ký với Google
                    </Button>

                    <Divider style={{ margin: '16px 0', color: '#94a3b8', fontSize: 13 }}>
                        hoặc dùng Email
                    </Divider>

                    {/* Mode Selector */}
                    <div style={{ marginBottom: 20 }}>
                        <Text style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>Bạn muốn:</Text>
                        <Radio.Group
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            buttonStyle="solid"
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                <Radio.Button
                                    value="create"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        padding: '10px 16px',
                                        borderRadius: 8,
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>🏢 Tạo tổ chức mới</div>
                                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>
                                        Tôi là chủ/quản lý toà nhà
                                    </div>
                                </Radio.Button>
                                <Radio.Button
                                    value="join"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        padding: '10px 16px',
                                        borderRadius: 8,
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>🤝 Tham gia bằng mã mời</div>
                                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>
                                        Tôi được mời vào tổ chức có sẵn
                                    </div>
                                </Radio.Button>
                            </Space>
                        </Radio.Group>
                    </div>

                    <Form
                        name="register"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="fullName"
                            label={<span style={{ fontWeight: 500 }}>Họ và tên</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="Nguyễn Văn A"
                            />
                        </Form.Item>

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
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label={<span style={{ fontWeight: 500 }}>Xác nhận mật khẩu</span>}
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="Nhập lại mật khẩu"
                            />
                        </Form.Item>

                        {/* Create Org — org name */}
                        {mode === 'create' && (
                            <Form.Item
                                name="orgName"
                                label={<span style={{ fontWeight: 500 }}>Tên tổ chức</span>}
                                rules={[{ required: true, message: 'Vui lòng nhập tên tổ chức!' }]}
                            >
                                <Input
                                    prefix={<TeamOutlined style={{ color: '#94a3b8' }} />}
                                    placeholder="VD: Chung cư Minh Đức"
                                />
                            </Form.Item>
                        )}

                        {/* Join Org — invite code */}
                        {mode === 'join' && (
                            <Form.Item
                                name="inviteCode"
                                label={<span style={{ fontWeight: 500 }}>Mã mời</span>}
                                rules={[{ required: true, message: 'Vui lòng nhập mã mời!' }]}
                            >
                                <Input
                                    prefix={<KeyOutlined style={{ color: '#94a3b8' }} />}
                                    placeholder="Nhập mã mời từ quản lý"
                                    style={{ fontFamily: 'monospace', letterSpacing: 2 }}
                                />
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                style={{ height: 44, fontWeight: 600, fontSize: 15 }}
                            >
                                {mode === 'create' ? 'Tạo tài khoản & tổ chức' : 'Tạo tài khoản & tham gia'}
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider style={{ margin: '8px 0 16px', color: '#94a3b8', fontSize: 13 }}>
                        Đã có tài khoản?
                    </Divider>

                    <Link href="/login" style={{ display: 'block' }}>
                        <Button block size="large" style={{ height: 44, fontWeight: 600 }}>
                            Đăng nhập
                        </Button>
                    </Link>

                    <div style={{ textAlign: 'center', marginTop: 24, color: '#94a3b8', fontSize: 12 }}>
                        © 2025 RentFlow. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
