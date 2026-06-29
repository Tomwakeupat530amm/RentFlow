'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Typography, Button, Tag, Row, Col, List, message, Space, Divider, Badge } from 'antd';
import {
    CheckCircleOutlined, CloseCircleOutlined, CrownOutlined,
    ThunderboltOutlined, SafetyOutlined, TeamOutlined,
    FileTextOutlined, BarChartOutlined, CameraOutlined,
    BankOutlined, EditOutlined,
} from '@ant-design/icons';

interface Props {
    currentPlan: 'free' | 'premium';
    isOwner: boolean;
}


const FREE_FEATURES = [
    { text: 'Tối đa 2 tòa nhà', icon: <CheckCircleOutlined />, included: true },
    { text: 'Tối đa 30 phòng', icon: <CheckCircleOutlined />, included: true },
    { text: 'Quản lý khách thuê & hợp đồng', icon: <CheckCircleOutlined />, included: true },
    { text: 'Chốt chỉ số điện/nước (nhập tay)', icon: <CheckCircleOutlined />, included: true },
    { text: 'Xem hóa đơn trên web', icon: <CheckCircleOutlined />, included: true },
    { text: 'Dashboard cơ bản', icon: <CheckCircleOutlined />, included: true },
    { text: 'Sự cố (danh sách)', icon: <CheckCircleOutlined />, included: true },
    { text: 'AI quét CCCD tự động', icon: <CloseCircleOutlined />, included: false },
    { text: 'Quét ảnh đồng hồ điện/nước', icon: <CloseCircleOutlined />, included: false },
    { text: 'Thanh toán tự động (VietQR)', icon: <CloseCircleOutlined />, included: false },
    { text: 'Hợp đồng điện tử (E-Sign)', icon: <CloseCircleOutlined />, included: false },
    { text: 'Kanban kéo thả & Excel export', icon: <CloseCircleOutlined />, included: false },
    { text: 'Phân quyền nâng cao (RBAC)', icon: <CloseCircleOutlined />, included: false },
];

const PREMIUM_FEATURES = [
    { text: 'Không giới hạn tòa nhà & phòng', icon: <ThunderboltOutlined />, included: true, highlight: true },
    { text: 'Tất cả tính năng gói Free', icon: <CheckCircleOutlined />, included: true },
    { text: 'AI quét CCCD tự động điền form', icon: <CameraOutlined />, included: true, highlight: true },
    { text: 'Quét ảnh đồng hồ điện/nước', icon: <CameraOutlined />, included: true, highlight: true },
    { text: 'VietQR & thanh toán tự động', icon: <BankOutlined />, included: true, highlight: true },
    { text: 'Hợp đồng điện tử (E-Sign)', icon: <EditOutlined />, included: true, highlight: true },
    { text: 'Kanban kéo thả sự cố', icon: <SafetyOutlined />, included: true },
    { text: 'Báo cáo nâng cao & Excel export', icon: <BarChartOutlined />, included: true },
    { text: 'Phân quyền (Kế toán, Bảo vệ…)', icon: <TeamOutlined />, included: true, highlight: true },
    { text: 'Xuất hóa đơn PDF', icon: <FileTextOutlined />, included: true },
    { text: 'Hỗ trợ ưu tiên', icon: <CrownOutlined />, included: true },
];

export default function PricingClient({ currentPlan, isOwner }: Props) {
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'success') {
            message.success('🎉 Thanh toán thành công! Gói Premium của bạn sẽ được kích hoạt trong giây lát.');
            // Clean up the URL
            router.replace('/pricing');
        } else if (status === 'cancelled') {
            message.info('Thanh toán đã bị hủy.');
            router.replace('/pricing');
        }
    }, [searchParams, router]);

    const handleUpgrade = async () => {
        if (!isOwner) {
            message.warning('Chỉ chủ sở hữu tổ chức mới có thể nâng cấp gói!');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ months: 1 })
            });
            const data = await res.json();
            
            if (!res.ok) {
                message.error(data.error || 'Có lỗi xảy ra khi tạo thanh toán');
                return;
            }

            if (data.checkoutUrl) {
                // Redirect to PayOS payment page
                window.location.href = data.checkoutUrl;
            } else {
                message.error('Không nhận được link thanh toán từ hệ thống');
            }
        } catch (error) {
            console.error(error);
            message.error('Lỗi kết nối đến máy chủ thanh toán');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Typography.Title level={2} style={{ marginBottom: 8 }}>
                    <CrownOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    Chọn gói phù hợp
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ fontSize: 16 }}>
                    Bắt đầu miễn phí, nâng cấp khi cần. Quản lý nhà trọ chuyên nghiệp hơn với AI.
                </Typography.Paragraph>
            </div>

            <Row gutter={[24, 24]} align="stretch">
                {/* FREE TIER */}
                <Col xs={24} md={12}>
                    <Card
                        style={{
                            height: '100%',
                            borderRadius: 16,
                            border: currentPlan === 'free' ? '2px solid #0d9488' : '1px solid #e8e8e8',
                        }}
                        styles={{ body: { padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: 24 }}>
                                <Space align="baseline">
                                    <Tag color="default" style={{ fontSize: 14, padding: '2px 12px' }}>Cơ Bản</Tag>
                                    {currentPlan === 'free' && (
                                        <Tag color="green">Gói hiện tại</Tag>
                                    )}
                                </Space>
                                <Typography.Title level={1} style={{ margin: '16px 0 4px' }}>
                                    Miễn phí
                                </Typography.Title>
                                <Typography.Text type="secondary">Trọn đời, không cần thẻ tín dụng</Typography.Text>
                            </div>

                            <Divider style={{ margin: '16px 0' }} />

                            <List
                                dataSource={FREE_FEATURES}
                                renderItem={(item) => (
                                    <List.Item style={{ padding: '6px 0', border: 'none' }}>
                                        <Space>
                                            <span style={{ color: item.included ? '#52c41a' : '#d9d9d9' }}>
                                                {item.icon}
                                            </span>
                                            <Typography.Text style={{ color: item.included ? undefined : '#bfbfbf' }}>
                                                {item.text}
                                            </Typography.Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </div>

                        <Button
                            size="large"
                            block
                            disabled={currentPlan === 'free'}
                            style={{ marginTop: 24, borderRadius: 8, height: 48 }}
                        >
                            {currentPlan === 'free' ? 'Đang sử dụng' : 'Quay lại Free'}
                        </Button>
                    </Card>
                </Col>

                {/* PREMIUM TIER */}
                <Col xs={24} md={12}>
                    <Badge.Ribbon text="Phổ biến nhất" color="gold">
                        <Card
                            style={{
                                height: '100%',
                                borderRadius: 16,
                                border: currentPlan === 'premium' ? '2px solid #faad14' : '2px solid #ffd666',
                                background: 'linear-gradient(180deg, #fffbe6 0%, #ffffff 30%)',
                            }}
                            styles={{ body: { padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: 24 }}>
                                    <Space align="baseline">
                                        <Tag icon={<CrownOutlined />} color="gold" style={{ fontSize: 14, padding: '2px 12px' }}>
                                            Premium
                                        </Tag>
                                        {currentPlan === 'premium' && (
                                            <Tag color="green">Gói hiện tại</Tag>
                                        )}
                                    </Space>
                                    <Typography.Title level={1} style={{ margin: '16px 0 4px' }}>
                                        199K<Typography.Text type="secondary" style={{ fontSize: 16, fontWeight: 400 }}> /tháng</Typography.Text>
                                    </Typography.Title>
                                    <Typography.Text type="secondary">Hoặc 1,990K/năm (tiết kiệm 17%)</Typography.Text>
                                </div>

                                <Divider style={{ margin: '16px 0' }} />

                                <List
                                    dataSource={PREMIUM_FEATURES}
                                    renderItem={(item: { text: string; icon: React.ReactNode; included: boolean; highlight?: boolean }) => (
                                        <List.Item style={{ padding: '6px 0', border: 'none' }}>
                                            <Space>
                                                <span style={{ color: '#faad14' }}>
                                                    {item.icon}
                                                </span>
                                                <Typography.Text strong={item.highlight}>
                                                    {item.text}
                                                </Typography.Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={loading}
                                disabled={currentPlan === 'premium'}
                                onClick={handleUpgrade}
                                style={{
                                    marginTop: 24,
                                    borderRadius: 8,
                                    height: 48,
                                    background: currentPlan === 'premium' ? undefined : 'linear-gradient(135deg, #faad14, #fa8c16)',
                                    borderColor: 'transparent',
                                    fontWeight: 600,
                                    fontSize: 16,
                                }}
                            >
                                {currentPlan === 'premium' ? '✅ Đang sử dụng' : '⚡ Nâng cấp ngay'}
                            </Button>
                        </Card>
                    </Badge.Ribbon>
                </Col>
            </Row>

            {/* FAQ */}
            <div style={{ textAlign: 'center', marginTop: 48, padding: '0 24px' }}>
                <Typography.Title level={4}>Câu hỏi thường gặp</Typography.Title>
                <Row gutter={[24, 16]} style={{ textAlign: 'left', maxWidth: 800, margin: '0 auto' }}>
                    <Col span={24}>
                        <Typography.Text strong>💡 Tôi có mất dữ liệu khi hết hạn Premium không?</Typography.Text>
                        <br />
                        <Typography.Text type="secondary">
                            Không. Dữ liệu luôn được bảo toàn. Khi hết hạn, bạn chỉ không thể sử dụng
                            các tính năng nâng cao và sẽ bị giới hạn quy mô về gói Free.
                        </Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Typography.Text strong>💳 Thanh toán bằng hình thức nào?</Typography.Text>
                        <br />
                        <Typography.Text type="secondary">
                            Chuyển khoản ngân hàng hoặc ví điện tử. Sau khi thanh toán, gói Premium
                            sẽ được kích hoạt trong vòng 5 phút.
                        </Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Typography.Text strong>🔄 Tôi có thể hủy bất cứ lúc nào không?</Typography.Text>
                        <br />
                        <Typography.Text type="secondary">
                            Có. Bạn có thể hủy gói Premium bất cứ lúc nào. Gói sẽ tiếp tục hoạt động
                            cho đến ngày hết hạn.
                        </Typography.Text>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
