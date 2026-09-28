'use client';

import React from 'react';
import { Typography, Row, Col, Card, Progress, Empty, Button } from 'antd';
import {
    ProjectOutlined,
    HomeOutlined,
    TeamOutlined,
    PlusOutlined,
    DollarOutlined,
    WalletOutlined,
    WarningOutlined,
    ToolOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import StatCard from '@/components/common/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';


interface DashboardStats {
    fullName: string;
    role: string;
    buildingCount: number;
    roomStats: {
        total: number;
        occupied: number;
        vacant: number;
        maintenance: number;
    };
    financials: {
        totalRevenue: number;
        totalCollectedThisMonth: number;
        totalDebt: number;
        totalExpenses: number;
        monthlyRevenue: { month: string; revenue: number; collected: number; expenses?: number; profit?: number }[];
    };
    actionAlerts?: {
        incidents: number;
        unpaidInvoices: number;
        expiringContracts: number;
        totalDebt: number;
    };
}

export default function DashboardPage({ stats }: { stats: DashboardStats | null }) {
    if (!stats) {
        return (
            <Card style={{ borderRadius: 12, textAlign: 'center', padding: '48px 0' }}>
                <Empty description="Không thể tải dữ liệu. Hãy thử đăng nhập lại." />
            </Card>
        );
    }

    const { fullName, buildingCount, roomStats, financials } = stats;

    // Greeting based on time
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

    const occupancyRate = roomStats.total > 0
        ? Math.round((roomStats.occupied / roomStats.total) * 100 * 10) / 10
        : 0;

    const currentMonthLabel = `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

    const statCardsData = [
        {
            title: `Doanh thu (${currentMonthLabel})`,
            value: financials.totalRevenue.toLocaleString() + ' đ',
            icon: <DollarOutlined style={{ fontSize: 22 }} />,
            iconBg: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
            iconShadow: 'rgba(13, 148, 136, 0.25)',
        },
        {
            title: `Thực thu (${currentMonthLabel})`,
            value: financials.totalCollectedThisMonth.toLocaleString() + ' đ',
            icon: <WalletOutlined style={{ fontSize: 22 }} />,
            iconBg: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            iconShadow: 'rgba(59, 130, 246, 0.25)',
        },
        {
            title: `Tổng chi (${currentMonthLabel})`,
            value: (financials.totalExpenses || 0).toLocaleString() + ' đ',
            icon: <WarningOutlined style={{ fontSize: 22 }} />,
            iconBg: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
            iconShadow: 'rgba(239, 68, 68, 0.25)',
        },
        {
            title: `Lợi nhuận (${currentMonthLabel})`,
            value: ((financials.totalCollectedThisMonth || 0) - (financials.totalExpenses || 0)).toLocaleString() + ' đ',
            icon: <DollarOutlined style={{ fontSize: 22 }} />,
            iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            iconShadow: 'rgba(139, 92, 246, 0.25)',
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Page Header */}
            <div>
                <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    {greeting}, {fullName} 👋
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                    Đây là tổng quan hệ thống ngày hôm nay.
                </Typography.Text>
            </div>

            {/* Stat Cards */}
            <Row gutter={[16, 16]}>
                {statCardsData.map((stat, index) => (
                    <Col xs={24} sm={12} xl={6} key={index}>
                        <StatCard {...stat} />
                    </Col>
                ))}
            </Row>

            {/* Content */}
            <Row gutter={[16, 16]}>
                {/* Revenue Chart */}
                <Col xs={24} xl={16}>
                    <RevenueChart data={financials.monthlyRevenue} />
                </Col>

                {/* Room Status Sidebar */}
                <Col xs={24} xl={8}>
                    <Card
                        variant="borderless"
                        style={{ borderRadius: 12 }}
                        title={<span style={{ fontWeight: 700, fontSize: 15 }}>Trạng thái phòng</span>}
                    >
                        {roomStats.total === 0 ? (
                            <Typography.Text type="secondary">Chưa có phòng nào.</Typography.Text>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Typography.Text>Đang cho thuê</Typography.Text>
                                        <Typography.Text strong style={{ color: '#0d9488' }}>
                                            {roomStats.occupied} / {roomStats.total}
                                        </Typography.Text>
                                    </div>
                                    <Progress
                                        percent={roomStats.total > 0 ? Math.round((roomStats.occupied / roomStats.total) * 100) : 0}
                                        showInfo={false}
                                        strokeColor="#0d9488"
                                        trailColor="#f0fdf4"
                                        size="small"
                                    />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Typography.Text>Đang trống</Typography.Text>
                                        <Typography.Text strong style={{ color: '#3b82f6' }}>
                                            {roomStats.vacant} / {roomStats.total}
                                        </Typography.Text>
                                    </div>
                                    <Progress
                                        percent={roomStats.total > 0 ? Math.round((roomStats.vacant / roomStats.total) * 100) : 0}
                                        showInfo={false}
                                        strokeColor="#3b82f6"
                                        trailColor="#eff6ff"
                                        size="small"
                                    />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Typography.Text>Đang sửa chữa</Typography.Text>
                                        <Typography.Text strong style={{ color: '#f59e0b' }}>
                                            {roomStats.maintenance} / {roomStats.total}
                                        </Typography.Text>
                                    </div>
                                    <Progress
                                        percent={roomStats.total > 0 ? Math.round((roomStats.maintenance / roomStats.total) * 100) : 0}
                                        showInfo={false}
                                        strokeColor="#f59e0b"
                                        trailColor="#fffbeb"
                                        size="small"
                                    />
                                </div>

                                <Card
                                    style={{
                                        borderRadius: 12,
                                        background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                                        border: '1px solid #99f6e4',
                                    }}
                                    styles={{ body: { padding: 16, textAlign: 'center' } }}
                                >
                                    <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Tỷ lệ lấp đầy
                                    </Typography.Text>
                                    <div style={{ fontSize: 36, fontWeight: 800, color: '#0d9488', lineHeight: 1.2, marginTop: 4 }}>
                                        {occupancyRate}%
                                    </div>
                                </Card>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Today's Focus Action Center */}
            {(() => {
                const alerts: {
                    title: string;
                    subtitle: string;
                    href: string;
                    btnText: string;
                    icon: React.ReactNode;
                    color: string;
                    bg: string;
                    borderColor: string;
                }[] = [];

                if (stats.actionAlerts) {
                    if (stats.actionAlerts.incidents > 0) {
                        alerts.push({
                            title: `${stats.actionAlerts.incidents} sự cố đang chờ xử lý`,
                            subtitle: 'Khách thuê đã gửi phản ánh hỏng hóc hoặc yêu cầu sửa chữa.',
                            href: '/incidents',
                            btnText: 'Xử lý ngay',
                            icon: <ToolOutlined />,
                            color: '#ef4444',
                            bg: '#fef2f2',
                            borderColor: '#fecaca',
                        });
                    }
                    if (stats.actionAlerts.unpaidInvoices > 0) {
                        alerts.push({
                            title: `${stats.actionAlerts.unpaidInvoices} hoá đơn chưa thanh toán`,
                            subtitle: `Tổng dư nợ cần thu: ${stats.actionAlerts.totalDebt.toLocaleString()} đ`,
                            href: '/invoices',
                            btnText: 'Xem & Thu nợ',
                            icon: <DollarOutlined />,
                            color: '#f97316',
                            bg: '#fff7ed',
                            borderColor: '#fed7aa',
                        });
                    }
                    if (stats.actionAlerts.expiringContracts > 0) {
                        alerts.push({
                            title: `${stats.actionAlerts.expiringContracts} hợp đồng sắp hết hạn (30 ngày)`,
                            subtitle: 'Cần liên hệ khách thuê để gia hạn hoặc chuẩn bị nhận bàn giao phòng.',
                            href: '/contracts',
                            btnText: 'Gia hạn / Nhắc Zalo',
                            icon: <FileTextOutlined />,
                            color: '#eab308',
                            bg: '#fefce8',
                            borderColor: '#fef08a',
                        });
                    }
                }

                return (
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <Card
                                variant="borderless"
                                style={{
                                    borderRadius: 12,
                                    border: alerts.length > 0 ? '1px solid #fed7aa' : '1px solid #ccfbf1',
                                    background: alerts.length > 0 ? '#fffaf0' : '#f0fdfa',
                                }}
                                styles={{ body: { padding: '16px 20px' } }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: alerts.length > 0 ? 14 : 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 20 }}>{alerts.length > 0 ? '⚡' : '🎉'}</span>
                                        <div>
                                            <span style={{ fontWeight: 700, fontSize: 15, color: alerts.length > 0 ? '#9a3412' : '#0f766e' }}>
                                                {alerts.length > 0 ? 'Cần xử lý hôm nay' : 'Mọi việc đều đang được xử lý ổn định!'}
                                            </span>
                                            <span style={{ fontSize: 12, color: alerts.length > 0 ? '#b45309' : '#14b8a6', marginLeft: 8 }}>
                                                {alerts.length > 0
                                                    ? `(${alerts.length} vấn đề cần chú ý)`
                                                    : 'Không có sự cố tồn đọng hay hợp đồng nào sắp hết hạn.'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {alerts.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                                        {alerts.map((alert, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    background: '#ffffff',
                                                    padding: '12px 16px',
                                                    borderRadius: 10,
                                                    border: `1px solid ${alert.borderColor}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 12,
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div
                                                        style={{
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 8,
                                                            background: alert.bg,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 18,
                                                            color: alert.color,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {alert.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                                                            {alert.title}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                            {alert.subtitle}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link href={alert.href}>
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        style={{
                                                            backgroundColor: alert.color,
                                                            borderColor: alert.color,
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            borderRadius: 6,
                                                        }}
                                                    >
                                                        {alert.btnText}
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>
                );
            })()}

            <Row gutter={[16, 16]}>
                {/* Quick Actions */}
                <Col xs={24}>
                    <Card
                        variant="borderless"
                        style={{ borderRadius: 12 }}
                        title={<span style={{ fontWeight: 700, fontSize: 15 }}>Lối tắt nhanh</span>}
                    >
                        {buildingCount === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                <Empty
                                    description={
                                        <span>
                                            Chưa có toà nhà nào. Bắt đầu bằng việc thêm toà nhà đầu tiên!
                                        </span>
                                    }
                                >
                                    <Link href="/buildings">
                                        <Button type="primary" icon={<PlusOutlined />} size="large">
                                            Thêm toà nhà đầu tiên
                                        </Button>
                                    </Link>
                                </Empty>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                                {[
                                    { label: 'Quản lý toà nhà', href: '/buildings', icon: <ProjectOutlined />, color: '#0d9488' },
                                    { label: 'Quản lý phòng', href: '/rooms', icon: <HomeOutlined />, color: '#3b82f6' },
                                    { label: 'Hoá đơn', href: '/invoices', icon: <DollarOutlined />, color: '#22c55e' },
                                    { label: 'Cài đặt tổ chức', href: '/settings', icon: <TeamOutlined />, color: '#f59e0b' },
                                ].map((action, i) => (
                                    <Link href={action.href} key={i}>
                                        <Card
                                            hoverable
                                            style={{ borderRadius: 10, textAlign: 'center', border: '1px solid #f0f0f0' }}
                                            styles={{ body: { padding: '16px' } }}
                                        >
                                            <div
                                                style={{
                                                    width: 40, height: 40, borderRadius: 10,
                                                    background: `${action.color}15`,
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 18, color: action.color, marginBottom: 8,
                                                }}
                                            >
                                                {action.icon}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{action.label}</div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
