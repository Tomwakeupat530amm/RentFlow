/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Table, Tag, Typography, Space, Avatar, Button, Modal, Descriptions } from 'antd';
import { UserOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ActivityLogsClientProps {
    initialLogs: any[];
}

export default function ActivityLogsClient({ initialLogs }: ActivityLogsClientProps) {
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getActionTag = (action: string) => {
        switch (action) {
            case 'CREATE': return <Tag color="green">Thêm mới</Tag>;
            case 'UPDATE': return <Tag color="blue">Cập nhật</Tag>;
            case 'DELETE': return <Tag color="red">Xóa</Tag>;
            default: return <Tag>{action}</Tag>;
        }
    };

    const getEntityName = (type: string) => {
        const map: any = {
            buildings: 'Tòa nhà',
            rooms: 'Phòng',
            tenants: 'Khách thuê',
            contracts: 'Hợp đồng',
            incidents: 'Sự cố',
            invoices: 'Hóa đơn',
            payments: 'Thanh toán',
            bookings: 'Lịch đặt',
            housekeeping_tasks: 'Dọn dẹp',
        };
        return map[type] || type;
    };

    const getEntityTitle = (record: any) => {
        const data = record.action === 'DELETE' ? record.old_data : record.new_data;
        if (!data) return record.entity_id;

        const title = data.name || data.full_name || data.title || data.guest_name || data.room_number || record.entity_id;
        return <Text strong>{title}</Text>;
    };

    const handleViewDetails = (record: any) => {
        setSelectedLog(record);
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'Thời gian',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm:ss'),
            width: 160,
        },
        {
            title: 'Người thực hiện',
            dataIndex: 'actor',
            key: 'actor',
            render: (actor: any) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <Text>{actor?.full_name || actor?.email || 'Hệ thống'}</Text>
                </Space>
            ),
        },
        {
            title: 'Hành động',
            dataIndex: 'action',
            key: 'action',
            render: (val: string) => getActionTag(val),
            width: 120,
        },
        {
            title: 'Đối tượng',
            dataIndex: 'entity_type',
            key: 'entity_type',
            render: (val: string) => <Tag>{getEntityName(val)}</Tag>,
            width: 150,
        },
        {
            title: 'Chi tiết',
            key: 'details',
            render: (_: any, record: any) => getEntityTitle(record),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 100,
            render: (_: any, record: any) => (
                <Button 
                    type="text" 
                    icon={<EyeOutlined />} 
                    onClick={() => handleViewDetails(record)}
                />
            )
        }
    ];

    return (
        <>
            <Table 
                dataSource={initialLogs}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 15 }}
                style={{ marginTop: 24 }}
            />

            <Modal
                title="Chi tiết hoạt động"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {selectedLog && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Thời gian">
                            {dayjs(selectedLog.created_at).format('DD/MM/YYYY HH:mm:ss')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người thực hiện">
                            {selectedLog.actor?.full_name || selectedLog.actor?.email || 'Hệ thống'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Hành động">
                            {getActionTag(selectedLog.action)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Đối tượng">
                            {getEntityName(selectedLog.entity_type)} (ID: {selectedLog.entity_id})
                        </Descriptions.Item>
                        
                        {selectedLog.old_data && (
                            <Descriptions.Item label="Dữ liệu cũ">
                                <pre style={{ margin: 0, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                                    {JSON.stringify(selectedLog.old_data, null, 2)}
                                </pre>
                            </Descriptions.Item>
                        )}
                        
                        {selectedLog.new_data && (
                            <Descriptions.Item label="Dữ liệu mới">
                                <pre style={{ margin: 0, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                                    {JSON.stringify(selectedLog.new_data, null, 2)}
                                </pre>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </>
    );
}
