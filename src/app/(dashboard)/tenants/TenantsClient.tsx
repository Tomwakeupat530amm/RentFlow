'use client';

import React, { useState } from 'react';
import {
    Card, Table, Button, Tag, Typography, Space, Tooltip, message,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined,
    MailOutlined, IdcardOutlined, UserOutlined, ReloadOutlined,
} from '@ant-design/icons';
import type { Tenant } from '@/types/database';
import { deleteTenant, toggleTenantActive, regenerateTenantPin } from './actions';
import dynamic from 'next/dynamic';
const TenantFormModal = dynamic(() => import('./TenantFormModal'), { ssr: false });
import ConfirmModal from '@/components/common/ConfirmModal';
import SearchInput from '@/components/common/SearchInput';


interface Props {
    initialTenants: Tenant[];
    serverError?: string | null;
    isPremium?: boolean;
}

export default function TenantsClient({ initialTenants, serverError, isPremium = false }: Props) {
    const [tenants, setTenants] = useState(initialTenants);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
    const [deleting, setDeleting] = useState(false);

    if (serverError) {
        message.error(serverError);
    }

    const filtered = tenants.filter(
        (t) =>
            t.full_name.toLowerCase().includes(search.toLowerCase()) ||
            t.phone?.toLowerCase().includes(search.toLowerCase()) ||
            t.email?.toLowerCase().includes(search.toLowerCase()) ||
            t.id_number?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const result = await deleteTenant(deleteTarget.id);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Đã xoá khách thuê');
            setTenants((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        }
        setDeleting(false);
        setDeleteTarget(null);
    };

    const handleToggleActive = async (tenant: Tenant) => {
        const result = await toggleTenantActive(tenant.id, !tenant.is_active);
        if (result.error) {
            message.error(result.error);
        } else {
            setTenants((prev) =>
                prev.map((t) =>
                    t.id === tenant.id ? { ...t, is_active: !t.is_active } : t
                )
            );
            message.success(tenant.is_active ? 'Đã vô hiệu hoá' : 'Đã kích hoạt lại');
        }
    };

    const handleRegeneratePin = async (tenant: Tenant) => {
        const result = await regenerateTenantPin(tenant.id);
        if (result.error || !result.pin) {
            message.error(result.error || 'Không thể tạo mã PIN');
        } else {
            message.success(`Đã tạo mã PIN mới cho ${tenant.full_name}: ${result.pin}`);
            const newPin = result.pin;
            setTenants((prev) =>
                prev.map((t) =>
                    t.id === tenant.id ? { ...t, access_code: newPin } : t
                )
            );
        }
    };

    const handleSuccess = () => {
        window.location.reload();
    };

    const columns = [
        {
            title: 'Khách thuê',
            key: 'info',
            render: (_: unknown, record: Tenant) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                background: record.is_active
                                    ? 'linear-gradient(135deg, #0d9488, #14b8a6)'
                                    : '#cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <UserOutlined style={{ color: 'white', fontSize: 16 }} />
                        </div>
                        <div>
                            <Typography.Text strong style={{ fontSize: 14 }}>{record.full_name}</Typography.Text>
                            {!record.is_active && (
                                <Tag color="default" style={{ marginLeft: 6, fontSize: 10 }}>
                                    Ngưng
                                </Tag>
                            )}
                            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                                {record.phone && (
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        <PhoneOutlined style={{ marginRight: 3 }} />
                                        {record.phone}
                                    </Typography.Text>
                                )}
                                {record.email && (
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        <MailOutlined style={{ marginRight: 3 }} />
                                        {record.email}
                                    </Typography.Text>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'CCCD/CMND',
            dataIndex: 'id_number',
            key: 'id_number',
            width: 150,
            render: (val: string | null) =>
                val ? (
                    <Space size={4}>
                        <IdcardOutlined style={{ color: '#94a3b8' }} />
                        <Typography.Text>{val}</Typography.Text>
                    </Space>
                ) : (
                    <Typography.Text type="secondary">—</Typography.Text>
                ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 110,
            filters: [
                { text: 'Đang thuê', value: true },
                { text: 'Ngưng', value: false },
            ],
            onFilter: (value: unknown, record: Tenant) => record.is_active === value,
            render: (_: unknown, record: Tenant) => (
                <Tag
                    color={record.is_active ? 'green' : 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleActive(record)}
                >
                    {record.is_active ? 'Đang thuê' : 'Ngưng'}
                </Tag>
            ),
        },
        {
            title: 'Mã PIN Portal',
            key: 'access_code',
            width: 150,
            render: (_: unknown, record: Tenant) => (
                <Space size={6}>
                    <Typography.Text 
                        code 
                        copyable={record.access_code ? { text: record.access_code, tooltips: ['Sao chép PIN', 'Đã chép!'] } : false}
                        style={{ fontWeight: 600, color: record.access_code ? '#0284c7' : '#94a3b8' }}
                    >
                        {record.access_code || 'Chưa cấp'}
                    </Typography.Text>
                    <Tooltip title="Cấp lại mã PIN mới">
                        <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined style={{ fontSize: 12, color: '#64748b' }} />}
                            onClick={() => handleRegeneratePin(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: 'Ghi chú',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            render: (val: string | null) => val || <Typography.Text type="secondary">—</Typography.Text>,
        },
        {
            title: '',
            key: 'actions',
            width: 90,
            render: (_: unknown, record: Tenant) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingTenant(record);
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
                <div className="w-full md:w-auto md:max-w-[360px] md:flex-1">
                    <SearchInput
                        placeholder="Tìm theo tên, SĐT, email, CCCD..."
                        onSearch={setSearch}
                        className="w-full"
                    />
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="w-full md:w-auto"
                    onClick={() => {
                        setEditingTenant(null);
                        setModalOpen(true);
                    }}
                >
                    Thêm khách thuê
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {[
                    { label: 'Tổng', value: tenants.length, color: '#1e293b' },
                    { label: 'Đang thuê', value: tenants.filter((t) => t.is_active).length, color: '#0d9488' },
                    { label: 'Ngưng', value: tenants.filter((t) => !t.is_active).length, color: '#94a3b8' },
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
                    pagination={filtered.length > 10 ? { pageSize: 10, showTotal: (t) => `Tổng ${t} khách`, position: ['bottomCenter'], showSizeChanger: true, responsive: true } : false}
                    size="middle"
                    locale={{ emptyText: 'Chưa có khách thuê nào' }}
                    scroll={{ x: 'max-content' }}
                    className="overflow-hidden"
                />
            </Card>

            {/* Form Modal */}
            <TenantFormModal
                open={modalOpen}
                tenant={editingTenant}
                isPremium={isPremium}
                onClose={() => {
                    setModalOpen(false);
                    setEditingTenant(null);
                }}
                onSuccess={handleSuccess}
            />

            {/* Delete Confirm */}
            <ConfirmModal
                open={!!deleteTarget}
                title="Xoá khách thuê"
                description={`Bạn có chắc muốn xoá "${deleteTarget?.full_name}"? Hợp đồng liên quan cũng sẽ bị xoá.`}
                confirmText="Xoá"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
