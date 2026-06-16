'use client';

import React, { useState } from 'react';
import {
    Card, Table, Button, Tag, Typography, Space, message, Select,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined,
    StopOutlined, CheckCircleOutlined, SyncOutlined
} from '@ant-design/icons';
import type { Contract, Room, Tenant, ContractStatus } from '@/types/database';
import { deleteContract, updateContractStatus } from './actions';
import dynamic from 'next/dynamic';
const ContractFormModal = dynamic(() => import('./ContractFormModal'), { ssr: false });
import ConfirmModal from '@/components/common/ConfirmModal';
import { Drawer, Descriptions, Divider, Grid } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;

interface Props {
    initialContracts: Contract[];
    rooms: Room[];
    tenants: Tenant[];
    serverError?: string | null;
}

export default function ContractsClient({ initialContracts, rooms, tenants, serverError }: Props) {
    const [contracts, setContracts] = useState(initialContracts);
    const screens = useBreakpoint();
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
    const [deleting, setDeleting] = useState(false);

    if (serverError) {
        message.error(serverError);
    }

    const filtered = contracts.filter((c) => {
        if (filterStatus === 'all') return true;
        return c.status === filterStatus;
    });

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const result = await deleteContract(deleteTarget.id);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Đã xoá hợp đồng');
            setContracts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        }
        setDeleting(false);
        setDeleteTarget(null);
    };

    const handleStatusChange = async (contract: Contract, newStatus: ContractStatus) => {
        const result = await updateContractStatus(contract.id, newStatus);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Đã cập nhật trạng thái');
            // Cập nhật state local
            setContracts((prev) =>
                prev.map((c) => (c.id === contract.id ? { ...c, status: newStatus } : c))
            );
        }
    };

    const handleSuccess = () => {
        window.location.reload();
    };



    const formatCurrency = (value: number) => {
        return value.toLocaleString('vi-VN') + ' đ';
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
                return { color: 'green', text: 'Đang hiệu lực', icon: <CheckCircleOutlined /> };
            case 'expired':
                return { color: 'warning', text: 'Sắp/Đã hết hạn', icon: <SyncOutlined /> };
            case 'terminated':
                return { color: 'default', text: 'Đã thanh lý', icon: <StopOutlined /> };
            default:
                return { color: 'default', text: status, icon: null };
        }
    };

    const columns = [
        {
            title: 'Phòng / Khách thuê',
            key: 'info',
            render: (_: unknown, record: Contract) => (
                <div>
                    <Typography.Text strong style={{ fontSize: 14, color: '#0d9488' }}>
                        Phòng {record.room?.name}
                    </Typography.Text>
                    {record.room?.building && (
                        <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                            ({record.room.building.name})
                        </Typography.Text>
                    )}
                    <div style={{ marginTop: 4 }}>
                        <Typography.Text style={{ fontSize: 14 }}>{record.tenant?.full_name}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                            SĐT: {record.tenant?.phone || '—'}
                        </Typography.Text>
                    </div>
                </div>
            ),
        },
        {
            title: 'Giá thuê & Cọc',
            key: 'financials',
            render: (_: unknown, record: Contract) => (
                <div>
                    <div>Giá: <Typography.Text strong>{formatCurrency(record.rent_amount)}</Typography.Text></div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                        Cọc: {formatCurrency(record.deposit)}
                    </div>
                </div>
            ),
        },
        {
            title: 'Thời hạn',
            key: 'period',
            render: (_: unknown, record: Contract) => (
                <div>
                    <div>Từ: <Typography.Text>{dayjs(record.start_date).format('DD/MM/YYYY')}</Typography.Text></div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                        Đến: {record.end_date ? dayjs(record.end_date).format('DD/MM/YYYY') : 'Vô thời hạn'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_: unknown, record: Contract) => {
                return (
                    <Select
                        size="small"
                        value={record.status}
                        onChange={(val: ContractStatus) => handleStatusChange(record, val)}
                        style={{ width: 130 }}
                        options={[
                            { value: 'active', label: <Tag color="green">Đang hiệu lực</Tag> },
                            { value: 'expired', label: <Tag color="warning">Hết hạn</Tag> },
                            { value: 'terminated', label: <Tag color="default">Thanh lý</Tag> },
                        ]}
                    />
                );
            },
        },
        {
            title: 'Bản scan',
            dataIndex: 'scan_url',
            key: 'scan_url',
            align: 'center' as const,
            render: (url: string | null) =>
                url ? (
                    <Button
                        type="link"
                        icon={<FileTextOutlined />}
                        href={url}
                        target="_blank"
                    >
                        Xem
                    </Button>
                ) : (
                    <Typography.Text type="secondary">—</Typography.Text>
                ),
        },
        {
            title: '',
            key: 'actions',
            width: 90,
            align: 'right' as const,
            render: (_: unknown, record: Contract) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        title="Xem chi tiết & Ký tên"
                        onClick={() => {
                            setSelectedContract(record);
                            setDetailDrawerOpen(true);
                        }}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingContract(record);
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
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <Space className="w-full md:w-auto">
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        className="w-full md:w-[150px]"
                        options={[
                            { value: 'all', label: 'Tất cả trạng thái' },
                            { value: 'active', label: 'Đang hiệu lực' },
                            { value: 'expired', label: 'Hết hạn' },
                            { value: 'terminated', label: 'Đã thanh lý' },
                        ]}
                    />
                </Space>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="w-full md:w-auto"
                    onClick={() => {
                        setEditingContract(null);
                        setModalOpen(true);
                    }}
                >
                    Tạo hợp đồng
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {[
                    { label: 'Tổng', value: contracts.length, color: '#1e293b' },
                    { label: 'Đang hiệu lực', value: contracts.filter((c) => c.status === 'active').length, color: '#0d9488' },
                    { label: 'Sắp hết hạn', value: contracts.filter((c) => c.status === 'expired').length, color: '#f59e0b' },
                ].map((stat) => (
                    <Card
                        key={stat.label}
                        className="rounded-xl shadow-sm border-gray-100"
                        styles={{ body: { padding: '16px', textAlign: 'center' } }}
                    >
                        <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{stat.label}</div>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 0' } }} className="shadow-sm border-gray-100">
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    pagination={filtered.length > 10 ? { pageSize: 10, position: ['bottomCenter'], showSizeChanger: true, responsive: true } : false}
                    size="middle"
                    locale={{ emptyText: 'Chưa có hợp đồng nào' }}
                    scroll={{ x: 'max-content' }}
                    className="overflow-hidden"
                />
            </Card>

            {/* Form Modal */}
            <ContractFormModal
                open={modalOpen}
                contract={editingContract}
                rooms={rooms}
                tenants={tenants}
                onClose={() => {
                    setModalOpen(false);
                    setEditingContract(null);
                }}
                onSuccess={handleSuccess}
            />

            {/* Delete Confirm */}
            <ConfirmModal
                open={!!deleteTarget}
                title="Xoá hợp đồng"
                description={`Bạn có chắc muốn xoá hợp đồng của phòng "${deleteTarget?.room?.name}"? Mọi thông tin liên quan sẽ bị xoá.`}
                confirmText="Xoá"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* Detail & Signature Drawer */}
            <Drawer
                title="Chi tiết Hợp đồng"
                placement="right"
                width={screens.xs ? '100%' : 500}
                onClose={() => {
                    setDetailDrawerOpen(false);
                    setSelectedContract(null);
                }}
                open={detailDrawerOpen}
            >
                {selectedContract && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <Descriptions title="Thông tin cơ bản" column={1} bordered size="small">
                            <Descriptions.Item label="Phòng">{selectedContract.room?.name}</Descriptions.Item>
                            <Descriptions.Item label="Khách thuê">{selectedContract.tenant?.full_name}</Descriptions.Item>
                            <Descriptions.Item label="Giá thuê">{formatCurrency(selectedContract.rent_amount)}</Descriptions.Item>
                            <Descriptions.Item label="Tiền cọc">{formatCurrency(selectedContract.deposit)}</Descriptions.Item>
                            <Descriptions.Item label="Thời hạn">
                                {dayjs(selectedContract.start_date).format('DD/MM/YYYY')} - {selectedContract.end_date ? dayjs(selectedContract.end_date).format('DD/MM/YYYY') : 'Vô thời hạn'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {selectedContract.status === 'active' ? <Tag color="green">Đang hiệu lực</Tag> : <Tag>{selectedContract.status}</Tag>}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider style={{ margin: '8px 0' }} />

                        {selectedContract.scan_url ? (
                            <div style={{
                                padding: '16px',
                                background: '#f6ffed',
                                border: '1px solid #b7eb8f',
                                borderRadius: 12,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                                    <Typography.Text strong style={{ fontSize: 15 }}>Hợp đồng đã được xác nhận</Typography.Text>
                                </div>
                                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                                    Bản scan hợp đồng có chữ ký vật lý đã được tải lên hệ thống.
                                </Typography.Text>
                                <Button
                                    icon={<FileTextOutlined />}
                                    href={selectedContract.scan_url}
                                    target="_blank"
                                    block
                                    type="primary"
                                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Xem bản scan hợp đồng
                                </Button>
                            </div>
                        ) : (
                            <div style={{
                                padding: '16px',
                                background: '#fffbe6',
                                border: '1px solid #ffe58f',
                                borderRadius: 12,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <FileTextOutlined style={{ color: '#faad14', fontSize: 18 }} />
                                    <Typography.Text strong style={{ fontSize: 15 }}>Chưa có bản scan</Typography.Text>
                                </div>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                    Hãy chỉnh sửa hợp đồng và tải lên bản scan có chữ ký để xác nhận.
                                </Typography.Text>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
}
