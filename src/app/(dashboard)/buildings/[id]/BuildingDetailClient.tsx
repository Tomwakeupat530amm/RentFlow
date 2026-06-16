'use client';

import React, { useState } from 'react';
import {
    Card, Table, Button, Tag, Typography, Space, message, Breadcrumb, Statistic, Row, Col,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
    HomeOutlined, ArrowLeftOutlined, CheckCircleOutlined,
    ToolOutlined, DollarOutlined, AppstoreOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { Tabs } from 'antd';
import type { Building, Room, RoomStatus, RoomType, ServicePrice } from '@/types/database';
import { deleteRoom } from './actions';
import RoomFormModal from './RoomFormModal';
import CsvImportModal from './CsvImportModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import SearchInput from '@/components/common/SearchInput';
import ServicePricesTable from './ServicePricesTable';

const { Text, Title } = Typography;

const statusConfig: Record<RoomStatus, { label: string; color: string; icon: React.ReactNode }> = {
    vacant: { label: 'Trống', color: 'blue', icon: <CheckCircleOutlined /> },
    occupied: { label: 'Đang thuê', color: 'green', icon: <HomeOutlined /> },
    maintenance: { label: 'Sửa chữa', color: 'orange', icon: <ToolOutlined /> },
};

const roomTypeLabels: Record<RoomType, string> = {
    single: 'Đơn',
    double: 'Đôi',
    studio: 'Studio',
    other: 'Khác',
};

interface Props {
    building: Building;
    initialRooms: Room[];
    initialServicePrices: ServicePrice[];
}

export default function BuildingDetailClient({ building, initialRooms, initialServicePrices }: Props) {
    const [rooms, setRooms] = useState(initialRooms);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
    const [deleting, setDeleting] = useState(false);

    const filtered = rooms.filter(
        (r) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.notes?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const result = await deleteRoom(deleteTarget.id, building.id);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Đã xoá phòng thành công');
            setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        }
        setDeleting(false);
        setDeleteTarget(null);
    };

    const handleSuccess = () => {
        window.location.reload();
    };

    // Stats
    const totalRooms = rooms.length;
    const occupied = rooms.filter((r) => r.status === 'occupied').length;
    const vacant = rooms.filter((r) => r.status === 'vacant').length;
    const maintenance = rooms.filter((r) => r.status === 'maintenance').length;

    const columns = [
        {
            title: 'Tên phòng',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: Room) => (
                <Link href={`/rooms/${record.id}`} style={{ color: '#0d9488', fontWeight: 600 }}>
                    {name}
                </Link>
            ),
            sorter: (a: Room, b: Room) => a.name.localeCompare(b.name),
        },
        {
            title: 'Tầng',
            dataIndex: 'floor',
            key: 'floor',
            width: 80,
            align: 'center' as const,
            sorter: (a: Room, b: Room) => a.floor - b.floor,
        },
        {
            title: 'Loại',
            dataIndex: 'room_type',
            key: 'room_type',
            width: 100,
            render: (type: RoomType) => roomTypeLabels[type] || type,
        },
        {
            title: 'Diện tích (m²)',
            dataIndex: 'area_m2',
            key: 'area_m2',
            width: 120,
            align: 'right' as const,
            render: (val: number | null) => val ? `${val}` : '—',
        },
        {
            title: 'Giá thuê (đ)',
            dataIndex: 'default_rent',
            key: 'default_rent',
            width: 140,
            align: 'right' as const,
            render: (val: number) =>
                val ? new Intl.NumberFormat('vi-VN').format(val) : '—',
            sorter: (a: Room, b: Room) => a.default_rent - b.default_rent,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            filters: [
                { text: 'Trống', value: 'vacant' },
                { text: 'Đang thuê', value: 'occupied' },
                { text: 'Sửa chữa', value: 'maintenance' },
            ],
            onFilter: (value: unknown, record: Room) => record.status === value,
            render: (status: RoomStatus) => {
                const config = statusConfig[status];
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {config.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Ghi chú',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            render: (notes: string | null) => notes || <Text type="secondary">—</Text>,
        },
        {
            title: '',
            key: 'actions',
            width: 100,
            render: (_: unknown, record: Room) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingRoom(record);
                            setModalOpen(true);
                        }}
                    />
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setDeleteTarget(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Breadcrumb */}
            <Breadcrumb
                items={[
                    { title: <Link href="/buildings">Toà nhà</Link> },
                    { title: building.name },
                ]}
            />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link href="/buildings">
                            <Button type="text" icon={<ArrowLeftOutlined />} size="small" />
                        </Link>
                        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{building.name}</Title>
                        <Tag color={building.status === 'active' ? 'green' : 'default'}>
                            {building.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                        </Tag>
                    </div>
                    {building.address && (
                        <Text type="secondary" style={{ fontSize: 13, marginLeft: 40 }}>
                            {building.address}
                        </Text>
                    )}
                </div>
                <Space>
                    <Button icon={<UploadOutlined />} onClick={() => setCsvModalOpen(true)}>
                        Import CSV
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingRoom(null);
                            setModalOpen(true);
                        }}
                    >
                        Thêm phòng
                    </Button>
                </Space>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]}>
                {[
                    { title: 'Tổng phòng', value: totalRooms, color: '#1e293b' },
                    { title: 'Đang thuê', value: occupied, color: '#0d9488', suffix: `/ ${totalRooms}` },
                    { title: 'Trống', value: vacant, color: '#3b82f6' },
                    { title: 'Sửa chữa', value: maintenance, color: '#f59e0b' },
                ].map((stat, i) => (
                    <Col xs={12} sm={6} key={i}>
                        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 20px' } }}>
                            <Statistic
                                title={<span style={{ fontSize: 12, color: '#94a3b8' }}>{stat.title}</span>}
                                value={stat.value}
                                suffix={stat.suffix}
                                valueStyle={{ color: stat.color, fontSize: 24, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Tabs
                defaultActiveKey="rooms"
                items={[
                    {
                        key: 'rooms',
                        label: <span style={{ fontWeight: 500 }}><AppstoreOutlined /> Danh sách phòng</span>,
                        children: (
                            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 0' } }}>
                                <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: 15 }}>Danh sách phòng</Text>
                                    <SearchInput
                                        placeholder="Tìm phòng..."
                                        onSearch={setSearch}
                                    />
                                </div>
                                <Table
                                    columns={columns}
                                    dataSource={filtered}
                                    rowKey="id"
                                    pagination={filtered.length > 10 ? { pageSize: 10, showTotal: (t) => `Tổng ${t} phòng` } : false}
                                    size="middle"
                                    locale={{ emptyText: 'Chưa có phòng nào' }}
                                />
                            </Card>
                        )
                    },
                    {
                        key: 'services',
                        label: <span style={{ fontWeight: 500 }}><DollarOutlined /> Bảng giá dịch vụ</span>,
                        children: (
                            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 0' } }}>
                                <ServicePricesTable buildingId={building.id} initialPrices={initialServicePrices} />
                            </Card>
                        )
                    }
                ]}
            />

            {/* Room Form Modal */}
            <RoomFormModal
                open={modalOpen}
                room={editingRoom}
                buildingId={building.id}
                numFloors={building.num_floors}
                onClose={() => {
                    setModalOpen(false);
                    setEditingRoom(null);
                }}
                onSuccess={handleSuccess}
            />

            {/* CSV Import Modal */}
            <CsvImportModal
                open={csvModalOpen}
                buildingId={building.id}
                onClose={() => setCsvModalOpen(false)}
                onSuccess={handleSuccess}
            />

            {/* Delete Confirm */}
            <ConfirmModal
                open={!!deleteTarget}
                title="Xoá phòng"
                description={`Bạn có chắc muốn xoá phòng "${deleteTarget?.name}"? Hành động không thể hoàn tác.`}
                confirmText="Xoá phòng"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
