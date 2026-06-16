'use client';

import React, { useState } from 'react';
import { Card, Table, Typography, Button, Space, Modal, Form, Input, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Roommate, Tenant } from '@/types/database';
import { createRoommate, updateRoommate, deleteRoommate } from '../../contracts/actions';


interface Props {
    contractId: string;
    primaryTenant: Tenant | null;
    roommates: Roommate[];
}

export default function RoommatesSection({ contractId, primaryTenant, roommates }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoommate, setEditingRoommate] = useState<Roommate | null>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleOpenModal = (roommate?: Roommate) => {
        if (roommate) {
            setEditingRoommate(roommate);
            form.setFieldsValue({
                full_name: roommate.full_name,
                phone: roommate.phone,
                id_number: roommate.id_number,
            });
        } else {
            setEditingRoommate(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (editingRoommate) {
                const res = await updateRoommate(editingRoommate.id, values);
                if (res.error) message.error(res.error);
                else {
                    message.success('Cập nhật thành viên thành công');
                    handleCloseModal();
                }
            } else {
                const res = await createRoommate(contractId, values);
                if (res.error) message.error(res.error);
                else {
                    message.success('Thêm thành viên thành công');
                    handleCloseModal();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const res = await deleteRoommate(id);
        if (res.error) message.error(res.error);
        else message.success('Đã xoá thành viên');
    };

    // Combine primary tenant and roommates for the table
    interface RoommateRow {
        id: string;
        isPrimary: boolean;
        full_name: string;
        phone?: string | null;
        id_number?: string | null;
        org_id?: string;
        contract_id?: string;
        id_image_url?: string | null;
        created_at?: string;
        updated_at?: string;
    }

    const dataSource: RoommateRow[] = [];
    if (primaryTenant) {
        dataSource.push({
            id: 'primary',
            isPrimary: true,
            full_name: primaryTenant.full_name,
            phone: primaryTenant.phone,
            id_number: primaryTenant.id_number,
        });
    }
    roommates.forEach(r => {
        dataSource.push({ ...r, isPrimary: false });
    });

    const columns = [
        {
            title: 'Họ tên',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (val: string, record: RoommateRow) => (
                <Space>
                    <Typography.Text strong>{val}</Typography.Text>
                    {record.isPrimary && <Tag color="blue">Người đại diện</Tag>}
                </Space>
            )
        },
        { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
        { title: 'CCCD', dataIndex: 'id_number', key: 'id_number' },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: unknown, record: RoommateRow) => {
                if (record.isPrimary) return null; // Can't edit primary tenant here
                return (
                    <Space size="middle">
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record as Roommate)} />
                        <Popconfirm
                            title="Xoá người này?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                        >
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                );
            }
        }
    ];

    return (
        <Card style={{ borderRadius: 12, marginBottom: 24 }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 4px' }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Thành viên phòng (Hiện tại)</Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
                    Thêm người ở ghép
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={dataSource}
                rowKey="id"
                pagination={false}
                size="middle"
            />

            <Modal
                title={editingRoommate ? 'Cập nhật thông tin' : 'Thêm người ở ghép'}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={handleCloseModal}
                confirmLoading={loading}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="full_name"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input placeholder="VD: Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                    >
                        <Input placeholder="VD: 0987654321" />
                    </Form.Item>
                    <Form.Item
                        name="id_number"
                        label="CCCD/CMND"
                    >
                        <Input placeholder="VD: 001201201201" />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
