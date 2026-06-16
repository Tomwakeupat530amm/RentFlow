'use client';

import React, { useState } from 'react';
import { Card, Button, Space, Input, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Incident, IncidentStatus, Building } from '@/types/database';
import { deleteIncident, updateIncidentStatus } from './actions';
import dynamic from 'next/dynamic';
import { Skeleton } from 'antd';
const IncidentFormModal = dynamic(() => import('./IncidentFormModal'), { ssr: false, loading: () => <Skeleton active /> });
const KanbanBoard = dynamic(() => import('./KanbanBoard'), { ssr: false, loading: () => <Skeleton active /> });

const { Search } = Input;


interface IncidentsClientProps {
    initialData: Incident[];
    buildings: Building[];
    userRole: string;
    userId: string;
}

export default function IncidentsClient({ initialData, buildings, userRole }: IncidentsClientProps) {
    const [data, setData] = useState<Incident[]>(initialData);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');

    // Modal states
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingIncident, setEditingIncident] = useState<Incident | undefined>();


    const isOwner = userRole === 'owner';

    // Filters
    const filteredData = data.filter(item => {
        const matchText = (item.title || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (item.room?.name || '').toLowerCase().includes(searchText.toLowerCase());
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchText && matchStatus;
    });

    const handleDelete = async (id: string) => {
        const { error } = await deleteIncident(id);
        if (error) {
            message.error(error);
        } else {
            message.success('Đã xóa sự cố thành công');
            setData(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleStatusChange = async (id: string, newStatus: IncidentStatus) => {
        // Optimistic UI update
        const previousData = [...data];
        setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));

        // Call API in the background
        const { error } = await updateIncidentStatus(id, newStatus);
        if (error) {
            message.error(`Lỗi cập nhật trạng thái: ${error}`);
            // Revert on error
            setData(previousData);
        } else {
            message.success('Đã cập nhật trạng thái');
        }
    };

    const openCreateModal = () => {
        setEditingIncident(undefined);
        setIsModalVisible(true);
    };

    const openEditModal = (record: Incident) => {
        setEditingIncident(record);
        setIsModalVisible(true);
    };

    return (
        <Card className="shadow-sm border-gray-200" styles={{ body: { padding: '20px' } }}>
            <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
                <Space wrap>
                    <Search
                        placeholder="Tìm theo tiêu đề hoặc phòng..."
                        allowClear
                        onSearch={setSearchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                    />
                    <Select
                        defaultValue="all"
                        style={{ width: 150 }}
                        onChange={(val: IncidentStatus | 'all') => setStatusFilter(val)}
                        options={[
                            { value: 'all', label: 'Tất cả trạng thái' },
                            { value: 'open', label: 'Mới báo cáo' },
                            { value: 'in_progress', label: 'Đang xử lý' },
                            { value: 'resolved', label: 'Đã giải quyết' },
                        ]}
                    />
                </Space>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreateModal}
                    style={{ backgroundColor: '#0d9488' }}
                >
                    Báo cáo sự cố
                </Button>
            </div>

            <KanbanBoard
                incidents={filteredData}
                isOwner={isOwner}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
            />

            <IncidentFormModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                incident={editingIncident}
                buildings={buildings}
            />
        </Card >
    );
}
