'use client';

import React from 'react';
import { Card, Typography, Statistic, Row, Col, Progress, Tag, Space, Divider } from 'antd';
import {
    ArrowUpOutlined, ArrowDownOutlined,
    HomeOutlined, TeamOutlined, DollarOutlined,
    BarChartOutlined, ThunderboltOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface ReportData {
    totalRevenue: number;
    revenueChange: number;
    totalRooms: number;
    occupiedRooms: number;
    totalTenants: number;
    activeTenants: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalIncidents: number;
    openIncidents: number;
    monthlyRevenue: { month: string; amount: number }[];
}

interface Props {
    data: ReportData;
}

export default function AdvancedReportCard({ data }: Props) {
    const occupancyRate = data.totalRooms > 0
        ? Math.round((data.occupiedRooms / data.totalRooms) * 100)
        : 0;

    const collectionRate = (data.pendingInvoices + data.overdueInvoices) > 0
        ? Math.round(((data.pendingInvoices + data.overdueInvoices - data.overdueInvoices) / (data.pendingInvoices + data.overdueInvoices)) * 100)
        : 100;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Revenue Overview */}
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
                <Row gutter={[24, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Statistic
                            title={<Space><DollarOutlined /> Doanh thu tháng</Space>}
                            value={data.totalRevenue}
                            suffix="đ"
                            valueStyle={{ color: '#0d9488', fontSize: 22 }}
                            formatter={(val) => Number(val).toLocaleString('vi-VN')}
                        />
                        <div style={{ marginTop: 4 }}>
                            {data.revenueChange >= 0 ? (
                                <Tag icon={<ArrowUpOutlined />} color="green">
                                    +{data.revenueChange}% so với tháng trước
                                </Tag>
                            ) : (
                                <Tag icon={<ArrowDownOutlined />} color="red">
                                    {data.revenueChange}% so với tháng trước
                                </Tag>
                            )}
                        </div>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Statistic
                            title={<Space><HomeOutlined /> Tỷ lệ lấp đầy</Space>}
                            value={occupancyRate}
                            suffix="%"
                            valueStyle={{ fontSize: 22 }}
                        />
                        <Progress
                            percent={occupancyRate}
                            size="small"
                            strokeColor={occupancyRate > 80 ? '#52c41a' : occupancyRate > 50 ? '#faad14' : '#ff4d4f'}
                            showInfo={false}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {data.occupiedRooms}/{data.totalRooms} phòng
                        </Text>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Statistic
                            title={<Space><TeamOutlined /> Khách đang thuê</Space>}
                            value={data.activeTenants}
                            suffix={`/${data.totalTenants}`}
                            valueStyle={{ fontSize: 22 }}
                        />
                        <Progress
                            percent={data.totalTenants > 0 ? Math.round((data.activeTenants / data.totalTenants) * 100) : 0}
                            size="small"
                            strokeColor="#1890ff"
                            showInfo={false}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Statistic
                            title={<Space><ThunderboltOutlined /> Sự cố mở</Space>}
                            value={data.openIncidents}
                            suffix={`/${data.totalIncidents}`}
                            valueStyle={{ fontSize: 22, color: data.openIncidents > 0 ? '#ff4d4f' : '#52c41a' }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Collection & Revenue Summary */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
                        <Title level={5}>
                            <BarChartOutlined style={{ marginRight: 8 }} />
                            Thu tiền
                        </Title>
                        <Divider style={{ margin: '12px 0' }} />
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Hoá đơn chờ thanh toán</Text>
                                <Tag color="orange">{data.pendingInvoices}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Hoá đơn quá hạn</Text>
                                <Tag color="red">{data.overdueInvoices}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Tỷ lệ thu đúng hạn</Text>
                                <Text strong>{collectionRate}%</Text>
                            </div>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
                        <Title level={5}>
                            <DollarOutlined style={{ marginRight: 8 }} />
                            Doanh thu 6 tháng gần nhất
                        </Title>
                        <Divider style={{ margin: '12px 0' }} />
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            {data.monthlyRevenue.slice(-6).map(month => (
                                <div key={month.month} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>{month.month}</Text>
                                    <Text strong style={{ color: '#0d9488' }}>
                                        {month.amount.toLocaleString('vi-VN')}đ
                                    </Text>
                                </div>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
