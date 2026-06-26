'use client';

import React from 'react';
import { Card, Table, Tag, Typography, Breadcrumb, Tabs, Descriptions, Button, message } from 'antd';
import {
    FileTextOutlined, UserOutlined, ClockCircleOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Room, Contract, Tenant, MeterRecord } from '@/types/database';
import dayjs from 'dayjs';
import RoommatesSection from './RoommatesSection';
import { switchRoomModel } from './actions';


interface Props {
    room: Room;
    contracts: (Contract & { tenant: Tenant | null })[];
    meterHistory: MeterRecord[];
}

export default function RoomDetailClient({ room, contracts, meterHistory }: Props) {
    const router = useRouter();
    const [switching, setSwitching] = React.useState(false);
    
    const activeContract = contracts.find(c => c.status === 'active');

    // Tenants tab: display tenant history. The representative tenant comes from the contract.
    const uniqueTenantsMap = new Map<string, Tenant>();
    contracts.forEach(c => {
        if (c.tenant && !uniqueTenantsMap.has(c.tenant.id)) {
            uniqueTenantsMap.set(c.tenant.id, c.tenant);
        }
    });
    const tenantHistory = Array.from(uniqueTenantsMap.values());

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + ' đ';

    const renderRoomStatus = () => {
        switch (room.status) {
            case 'occupied': return <Tag color="green">Đang thuê</Tag>;
            case 'vacant': return <Tag color="blue">Trống</Tag>;
            case 'maintenance': return <Tag color="orange">Đang bảo trì</Tag>;
            default: return <Tag>{room.status}</Tag>;
        }
    };

    const contractsColumns = [
        {
            title: 'Khách đại diện',
            key: 'tenant',
            render: (c: Contract & { tenant: Tenant | null }) => <Typography.Text strong>{c.tenant?.full_name}</Typography.Text>
        },
        {
            title: 'Thời hạn',
            key: 'period',
            render: (c: Contract & { tenant: Tenant | null }) => (
                <>
                    {dayjs(c.start_date).format('DD/MM/YYYY')} - {c.end_date ? dayjs(c.end_date).format('DD/MM/YYYY') : 'Vô thời hạn'}
                </>
            )
        },
        {
            title: 'Giá thuê / Cọc',
            key: 'finance',
            render: (c: Contract & { tenant: Tenant | null }) => (
                <div>
                    <div>{formatCurrency(c.rent_amount)}/tháng</div>
                    <div style={{ fontSize: 12, color: '#888' }}>Cọc: {formatCurrency(c.deposit)}</div>
                </div>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                if (status === 'active') return <Tag color="green">Đang hiệu lực</Tag>;
                if (status === 'expired') return <Tag color="warning">Hết hạn</Tag>;
                return <Tag color="default">Đã thanh lý</Tag>;
            }
        },
        {
            title: 'Bản scan',
            dataIndex: 'scan_url',
            render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">Xem file</a> : '—'
        }
    ];

    const tenantsColumns = [
        { title: 'Họ tên', dataIndex: 'full_name', key: 'full_name', render: (val: string) => <Typography.Text strong>{val}</Typography.Text> },
        { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
        { title: 'CCCD', dataIndex: 'id_number', key: 'id_number' },
        { title: 'Ảnh', dataIndex: 'id_image_url', key: 'id_image_url', render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">Xem ảnh</a> : '—' },
    ];

    const metersColumns = [
        {
            title: 'Tháng',
            dataIndex: 'record_month',
            key: 'record_month',
            render: (val: string) => <Typography.Text strong>{dayjs(val).format('MM/YYYY')}</Typography.Text>
        },
        {
            title: 'Điện (Chỉ số)',
            key: 'elec_index',
            render: (r: MeterRecord) => `${r.electricity_old} → ${r.electricity_new}`
        },
        {
            title: 'Tiêu thụ (Điện)',
            dataIndex: 'electricity_usage',
            key: 'electricity_usage',
            render: (val: number) => <Typography.Text type="danger" strong>{val}</Typography.Text>
        },
        {
            title: 'Nước (Chỉ số)',
            key: 'water_index',
            render: (r: MeterRecord) => `${r.water_old} → ${r.water_new}`
        },
        {
            title: 'Tiêu thụ (Nước)',
            dataIndex: 'water_usage',
            key: 'water_usage',
            render: (val: number) => <Typography.Text style={{ color: '#0d9488' }} strong>{val}</Typography.Text>
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Breadcrumb
                items={[
                    { title: <Link href="/buildings">Toà nhà</Link> },
                    { title: <Link href={`/buildings/${room.building_id}`}>{room.building?.name || 'Chi tiết'}</Link> },
                    { title: `Phòng ${room.name}` },
                ]}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href={`/buildings/${room.building_id}`}>
                        <Button type="text" icon={<ArrowLeftOutlined />} />
                    </Link>
                    <Typography.Title level={4} style={{ margin: 0 }}>Phòng {room.name}</Typography.Title>
                    {renderRoomStatus()}
                    {room.rental_type === 'short_term' && <Tag color="purple">Homestay</Tag>}
                </div>
                
                <Button 
                    type="primary" 
                    ghost 
                    loading={switching}
                    onClick={async () => {
                        setSwitching(true);
                        const res = await switchRoomModel(room.id, room.rental_type || 'long_term');
                        if (res.error) {
                            message.error(res.error);
                        } else {
                            message.success('Chuyển đổi mô hình thành công!');
                            router.refresh();
                        }
                        setSwitching(false);
                    }}
                >
                    Đổi sang {room.rental_type === 'short_term' ? 'Thuê Dài hạn' : 'Homestay'}
                </Button>
            </div>

            <Card style={{ borderRadius: 12 }}>
                <Descriptions column={{ xs: 1, sm: 2, md: 4 }}>
                    <Descriptions.Item label="Toà nhà">{room.building?.name}</Descriptions.Item>
                    <Descriptions.Item label="Tầng">{room.floor}</Descriptions.Item>
                    <Descriptions.Item label="Diện tích">{room.area_m2 ? `${room.area_m2} m²` : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Giá mặc định"><Typography.Text strong>{formatCurrency(room.default_rent)}</Typography.Text></Descriptions.Item>
                </Descriptions>
            </Card>

            <Tabs
                defaultActiveKey="contracts"
                items={[
                    {
                        key: 'contracts',
                        label: <span><FileTextOutlined /> Hợp đồng</span>,
                        children: (
                            <Card style={{ borderRadius: 12 }}>
                                {activeContract && (
                                    <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                        <Typography.Title level={5} style={{ marginTop: 0, color: '#166534' }}>Hợp đồng hiện tại đang có hiệu lực</Typography.Title>
                                        <p style={{ margin: 0, color: '#15803d' }}>
                                            Ký bởi: <strong>{activeContract.tenant?.full_name}</strong> - Hết hạn: <strong>{activeContract.end_date ? dayjs(activeContract.end_date).format('DD/MM/YYYY') : 'Vô thời hạn'}</strong>
                                        </p>
                                    </div>
                                )}
                                <Table
                                    columns={contractsColumns}
                                    dataSource={contracts}
                                    rowKey="id"
                                    pagination={false}
                                />
                            </Card>
                        )
                    },
                    {
                        key: 'tenants',
                        label: <span><UserOutlined /> Khách thuê</span>,
                        children: (
                            <>
                                {activeContract && (
                                    <RoommatesSection
                                        contractId={activeContract.id}
                                        primaryTenant={activeContract.tenant}
                                        roommates={activeContract.roommates || []}
                                    />
                                )}
                                <Card style={{ borderRadius: 12 }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <Typography.Title level={5} style={{ margin: 0 }}>Lịch sử khách thuê</Typography.Title>
                                    </div>
                                    <Table
                                        columns={tenantsColumns}
                                        dataSource={tenantHistory}
                                        rowKey="id"
                                        pagination={false}
                                    />
                                </Card>
                            </>
                        )
                    },
                    {
                        key: 'meters',
                        label: <span><ClockCircleOutlined /> Lịch sử Điện/Nước</span>,
                        children: (
                            <Card style={{ borderRadius: 12 }}>
                                <Table
                                    columns={metersColumns}
                                    dataSource={meterHistory}
                                    rowKey="id"
                                    pagination={{ pageSize: 12 }}
                                />
                            </Card>
                        )
                    }
                ]}
            />
        </div>
    );
}
