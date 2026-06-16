'use client';

import React from 'react';
import { Modal, Typography, Button, Space, Divider } from 'antd';
import { CrownOutlined, ThunderboltOutlined, CheckCircleOutlined, StarOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';


interface PremiumUpgradeModalProps {
    open: boolean;
    onCancel: () => void;
    featureName?: string;
    description?: string;
}

export default function PremiumUpgradeModal({
    open,
    onCancel,
    featureName,
    description
}: PremiumUpgradeModalProps) {
    const router = useRouter();

    const handleUpgradeClick = () => {
        onCancel();
        router.push('/pricing');
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width={480}
            styles={{
                content: {
                    padding: 0,
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #ffd666',
                },
                mask: {
                    backdropFilter: 'blur(4px)',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                }
            }}
            closeIcon={<span style={{ color: '#8c8c8c', fontSize: 16 }}>✕</span>}
        >
            {/* Header: Gradient Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #030712 100%)',
                padding: '32px 24px',
                textAlign: 'center',
                position: 'relative',
            }} className="upgrade-modal-header">
                <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    fontSize: 80,
                    opacity: 0.1,
                    color: '#faad14',
                }}>
                    <CrownOutlined />
                </div>

                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #faad14, #d48806)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 16px rgba(250, 173, 20, 0.3)',
                    border: '2px solid rgba(255,255,255,0.2)',
                }}>
                    <CrownOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>

                <Typography.Title level={3} style={{ color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                    {featureName ? `Mở khóa ${featureName}` : 'Nâng cấp Premium'}
                </Typography.Title>
                <div style={{ marginTop: 8 }}>
                    <Typography.Text style={{ color: '#d1d5db', fontSize: 15 }}>
                        {description || 'Khám phá toàn bộ sức mạnh của RentFlow với hệ sinh thái tính năng tự động hóa và AI thông minh.'}
                    </Typography.Text>
                </div>
            </div>

            {/* Content: Feature List */}
            <div style={{ padding: '32px 24px', background: '#fff' }}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ background: '#f6ffed', padding: 8, borderRadius: 8 }}>
                            <StarOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                        </div>
                        <div>
                            <Typography.Text strong style={{ fontSize: 16, display: 'block' }}>Không giới hạn Tòa nhà & Phòng</Typography.Text>
                            <Typography.Text type="secondary">Mở rộng kinh doanh không lo giới hạn hệ thống.</Typography.Text>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ background: '#e6f7ff', padding: 8, borderRadius: 8 }}>
                            <ThunderboltOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        </div>
                        <div>
                            <Typography.Text strong style={{ fontSize: 16, display: 'block' }}>Tự động hóa với AI & Autofill</Typography.Text>
                            <Typography.Text type="secondary">Quét CCCD, quét chỉ số đồng hồ điện/nước siêu tốc.</Typography.Text>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ background: '#fffbe6', padding: 8, borderRadius: 8 }}>
                            <CheckCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
                        </div>
                        <div>
                            <Typography.Text strong style={{ fontSize: 16, display: 'block' }}>VietQR & Ký Hợp đồng Điện tử</Typography.Text>
                            <Typography.Text type="secondary">Gạch nợ hóa đơn tự động và ký hợp đồng ngay trên app.</Typography.Text>
                        </div>
                    </div>
                </Space>

                <Divider style={{ margin: '24px 0' }} />

                {/* Footer Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Button
                        type="primary"
                        size="large"
                        block
                        onClick={handleUpgradeClick}
                        style={{
                            height: 48,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #faad14, #fa8c16)',
                            borderColor: 'transparent',
                            fontSize: 16,
                            fontWeight: 600,
                            boxShadow: '0 4px 14px 0 rgba(250, 140, 22, 0.39)',
                        }}
                    >
                        Xem bảng giá & Nâng cấp ngay
                    </Button>
                    <Button
                        type="text"
                        block
                        onClick={onCancel}
                        style={{ color: '#8c8c8c', fontWeight: 500 }}
                    >
                        Chưa phải lúc này, để sau
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
