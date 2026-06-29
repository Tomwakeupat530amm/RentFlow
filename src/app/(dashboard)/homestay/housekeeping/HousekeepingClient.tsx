'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, message, Select } from 'antd';
import { CheckCircleOutlined, SyncOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { HousekeepingTask, Room } from '@/types/database';
import { updateHousekeepingTaskStatus } from './actions';
import HousekeepingModal from './HousekeepingModal';

interface HousekeepingClientProps {
    initialTasks: HousekeepingTask[];
    rooms: Room[];
}

export default function HousekeepingClient({ initialTasks, rooms }: HousekeepingClientProps) {
    const [tasks, setTasks] = useState<HousekeepingTask[]>(initialTasks);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Sync tasks when server provides new data (e.g. after revalidatePath)
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);
    
    const updateStatus = async (taskId: string, newStatus: string) => {
        // Optimistic update
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as HousekeepingTask['status'] } : t));
        
        const result = await updateHousekeepingTaskStatus(taskId, newStatus as import('@/types/database').TaskStatus);
        if (result.success) {
            message.success('Cập nhật trạng thái thành công!');
        } else {
            message.error(result.error || 'Có lỗi xảy ra khi cập nhật trạng thái');
            setTasks(previousTasks); // Rollback
        }
    };

    const columns = [
        {
            title: 'Phòng',
            dataIndex: ['room', 'name'],
            key: 'room_name',
            render: (text: string) => <strong className="text-slate-700">{text || 'Phòng không xác định'}</strong>,
        },
        {
            title: 'Loại công việc',
            dataIndex: 'task_type',
            key: 'task_type',
            render: (type: string) => {
                switch(type) {
                    case 'cleaning': return <Tag color="blue">Dọn dẹp</Tag>;
                    case 'maintenance': return <Tag color="orange">Bảo trì</Tag>;
                    case 'inspection': return <Tag color="purple">Kiểm tra</Tag>;
                    default: return <Tag>{type}</Tag>;
                }
            }
        },
        {
            title: 'Ngày thực hiện',
            dataIndex: 'scheduled_date',
            key: 'scheduled_date',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                switch(status) {
                    case 'pending': return <Tag icon={<ClockCircleOutlined />} color="default">Chờ xử lý</Tag>;
                    case 'in_progress': return <Tag icon={<SyncOutlined spin />} color="processing">Đang dọn</Tag>;
                    case 'completed': return <Tag icon={<CheckCircleOutlined />} color="success">Hoàn thành</Tag>;
                    default: return <Tag>{status}</Tag>;
                }
            }
        },
        {
            title: 'Thao tác nhanh',
            key: 'actions',
            render: (_: unknown, record: HousekeepingTask) => (
                <Space>
                    {record.status === 'pending' && (
                        <Button size="small" type="primary" onClick={() => updateStatus(record.id, 'in_progress')}>Bắt đầu dọn</Button>
                    )}
                    {record.status === 'in_progress' && (
                        <Button size="small" type="primary" className="bg-green-600" onClick={() => updateStatus(record.id, 'completed')}>Hoàn thành</Button>
                    )}
                    {record.status === 'completed' && (
                        <span className="text-slate-400 text-sm">Đã xong</span>
                    )}
                </Space>
            )
        }
    ];

    const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

    return (
        <div>
            <div className="mb-4 flex justify-between">
                <Space>
                    <Select 
                        value={filterStatus} 
                        onChange={setFilterStatus}
                        style={{ width: 150 }} 
                        options={[
                            { value: 'all', label: 'Tất cả trạng thái' },
                            { value: 'pending', label: 'Chờ xử lý' },
                            { value: 'in_progress', label: 'Đang dọn' },
                            { value: 'completed', label: 'Hoàn thành' },
                        ]} 
                    />
                </Space>
                <Button type="primary" className="bg-teal-600" onClick={() => setIsModalOpen(true)}>Thêm công việc</Button>
            </div>
            <Table 
                columns={columns} 
                dataSource={filteredTasks} 
                rowKey="id" 
                pagination={false}
                locale={{ emptyText: 'Chưa có công việc dọn dẹp nào' }}
            />
            
            <HousekeepingModal 
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                rooms={rooms}
            />
        </div>
    );
}
