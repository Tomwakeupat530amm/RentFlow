'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { updatePassword } from '../actions';

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();
    const router = useRouter();

    const onFinish = async (values: { password: string }) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('password', values.password);

        const result = await updatePassword(formData);
        
        if (result?.error) {
            message.error(result.error);
        } else if (result?.success) {
            message.success('Mật khẩu đã được cập nhật thành công!');
            // Redirect to login page
            router.push('/login');
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
                        <LockOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                    </div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                        Tạo mật khẩu mới
                    </Title>
                    <Text style={{ color: '#64748b', fontSize: 15, display: 'block', marginTop: 8 }}>
                        Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                    </Text>
                </div>

                <Form layout="vertical" onFinish={onFinish} size="large">
                    <Form.Item
                        name="password"
                        label={<span style={{ fontWeight: 500 }}>Mật khẩu mới</span>}
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="••••••••"
                        />
                    </Form.Item>
                    
                    <Form.Item
                        name="confirmPassword"
                        label={<span style={{ fontWeight: 500 }}>Xác nhận mật khẩu mới</span>}
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Hai mật khẩu không khớp nhau!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="••••••••"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            style={{ height: 44, fontWeight: 600, fontSize: 15 }}
                        >
                            Cập nhật mật khẩu
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}
