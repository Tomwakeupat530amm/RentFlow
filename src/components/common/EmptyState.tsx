import React from 'react';
import { Button, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface EmptyStateProps {
    /** Icon to display */
    icon?: React.ReactNode;
    /** Title text */
    title?: string;
    /** Description text */
    description?: string;
    /** Optional action button text */
    actionText?: string;
    /** Optional action button callback */
    onAction?: () => void;
}

/**
 * Empty state component for tables and lists with no data.
 * Shows an icon, message, and optional CTA button.
 */
export default function EmptyState({
    icon,
    title = 'Chưa có dữ liệu',
    description = 'Hãy bắt đầu bằng cách thêm mục đầu tiên.',
    actionText,
    onAction,
}: EmptyStateProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                }}
            >
                {icon || <InboxOutlined style={{ fontSize: 36, color: '#0d9488' }} />}
            </div>

            <Title level={5} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                {title}
            </Title>
            <Text type="secondary" style={{ marginTop: 4, fontSize: 14, maxWidth: 320 }}>
                {description}
            </Text>

            {actionText && onAction && (
                <Button
                    type="primary"
                    onClick={onAction}
                    style={{ marginTop: 20, fontWeight: 600 }}
                >
                    {actionText}
                </Button>
            )}
        </div>
    );
}
