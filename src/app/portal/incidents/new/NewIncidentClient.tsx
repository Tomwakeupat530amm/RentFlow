'use client';

import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function NewIncidentPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onFinish = async (values: { title: string; description: string }) => {
        setLoading(true);
        try {
            const res = await fetch('/api/tenant/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error('Có lỗi xảy ra');

            message.success('Đã gửi báo cáo sự cố');
            router.push('/portal/incidents');
            router.refresh();
        } catch (error: unknown) {
            message.error(error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center space-x-2 mb-6">
                <Link href="/portal/incidents">
                    <Button type="text" icon={<ArrowLeftOutlined />} />
                </Link>
                <h4 className="text-lg font-bold mb-0">Báo sự cố mới</h4>
            </div>

            <Form layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="title"
                    label="Tiêu đề"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                >
                    <Input placeholder="Ví dụ: Rò rỉ nước ở phòng tắm" size="large" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả chi tiết"
                    rules={[{ required: true, message: 'Vui lòng mô tả chi tiết sự cố' }]}
                >
                    <Input.TextArea rows={4} placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..." />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" size="large" className="w-full" loading={loading}>
                        Gửi báo cáo
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
