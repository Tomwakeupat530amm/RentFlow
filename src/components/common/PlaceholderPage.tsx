import React from 'react';
import { Card, Result, Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface PlaceholderPageProps {
    title: string;
    description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 64px - 96px)',
            }}
        >
            <Card
                variant="borderless"
                style={{
                    width: '100%',
                    maxWidth: 520,
                    borderRadius: 16,
                    textAlign: 'center',
                }}
            >
                <Result
                    icon={
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 20,
                                background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 8,
                            }}
                        >
                            <RocketOutlined style={{ fontSize: 36, color: '#0d9488' }} />
                        </div>
                    }
                    title={
                        <span style={{ fontWeight: 700, fontSize: 20, color: '#1e293b' }}>
                            {title}
                        </span>
                    }
                    subTitle={
                        <span style={{ color: '#64748b', fontSize: 14 }}>
                            {description || 'Tính năng này đang được phát triển và sẽ sớm ra mắt trong các bản cập nhật tới.'}
                        </span>
                    }
                    extra={
                        <Link href="/dashboard">
                            <Button type="primary" size="large" style={{ fontWeight: 600 }}>
                                Quay lại Tổng quan
                            </Button>
                        </Link>
                    }
                />
            </Card>
        </div>
    );
}
