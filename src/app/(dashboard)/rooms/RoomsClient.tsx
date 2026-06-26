'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Empty } from 'antd';
import {
    HomeOutlined, CheckCircleOutlined, ToolOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import type { Room, RoomStatus, RoomType } from '@/types/database';
import SearchInput from '@/components/common/SearchInput';



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

type RoomWithBuilding = Room & { building_name: string };

interface Props {
    initialRooms: RoomWithBuilding[];
}

export default function RoomsClient({ initialRooms }: Props) {
    const [search, setSearch] = useState('');

    const filtered = initialRooms.filter(
        (r) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.building_name.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            title: 'Phòng',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: RoomWithBuilding) => (
                <div className="flex items-center gap-2">
                    <Link href={`/rooms/${record.id}`} style={{ color: '#0d9488', fontWeight: 600 }}>
                        {name}
                    </Link>
                    {record.rental_type === 'short_term' && (
                        <Tag color="purple" className="m-0 border-purple-200 bg-purple-50">Homestay</Tag>
                    )}
                </div>
            ),
            sorter: (a: RoomWithBuilding, b: RoomWithBuilding) => a.name.localeCompare(b.name),
        },
        {
            title: 'Toà nhà',
            dataIndex: 'building_name',
            key: 'building_name',
            render: (name: string, record: RoomWithBuilding) => (
                <Link href={`/buildings/${record.building_id}`} style={{ color: '#0d9488' }}>
                    {name}
                </Link>
            ),
        },
        {
            title: 'Tầng',
            dataIndex: 'floor',
            key: 'floor',
            width: 70,
            align: 'center' as const,
        },
        {
            title: 'Loại',
            dataIndex: 'room_type',
            key: 'room_type',
            width: 80,
            render: (type: RoomType) => roomTypeLabels[type],
        },
        {
            title: 'Diện tích',
            dataIndex: 'area_m2',
            key: 'area_m2',
            width: 100,
            align: 'right' as const,
            render: (v: number | null) => v ? `${v} m²` : '—',
        },
        {
            title: 'Giá thuê (đ)',
            dataIndex: 'default_rent',
            key: 'default_rent',
            width: 130,
            align: 'right' as const,
            render: (v: number) => v ? new Intl.NumberFormat('vi-VN').format(v) : '—',
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
            onFilter: (value: unknown, record: RoomWithBuilding) => record.status === value,
            render: (status: RoomStatus) => {
                const config = statusConfig[status];
                return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
            },
        },
    ];

    return (
        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 0' } }} className="shadow-sm border-gray-100">
            <div className="px-4 pb-4 flex flex-col md:flex-row justify-end items-end md:items-center gap-4">
                <div className="w-full md:w-64">
                    <SearchInput
                        placeholder="Tìm phòng, toà nhà..."
                        onSearch={setSearch}
                    />
                </div>
            </div>
            {filtered.length === 0 && !search ? (
                <div style={{ padding: '24px 16px' }}>
                    <Empty description="Chưa có phòng nào. Hãy thêm toà nhà và phòng trước." />
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    pagination={filtered.length > 15 ? { pageSize: 15, showTotal: (t) => `Tổng ${t} phòng`, position: ['bottomCenter'], showSizeChanger: true, responsive: true } : false}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    className="overflow-hidden"
                />
            )}
        </Card>
    );
}
