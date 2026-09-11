'use client';

import React, { useState } from 'react';
import {
    Row, Col, Card, Button, Tag, Typography, Empty, message, Tooltip,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined,
    EnvironmentOutlined, EyeOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Building, PlanType } from '@/types/database';
import { deleteBuilding } from './actions';
import dynamic from 'next/dynamic';
const BuildingFormModal = dynamic(() => import('./BuildingFormModal'), { ssr: false });
import ConfirmModal from '@/components/common/ConfirmModal';
import SearchInput from '@/components/common/SearchInput';
import QuotaProgress from '@/components/common/QuotaProgress';

interface BuildingsClientProps {
    initialBuildings: Building[];
    serverError?: string;
    buildingCount?: number;
    limit?: number;
    planType?: PlanType;
}

export default function BuildingsClient({ 
    initialBuildings, 
    serverError,
    buildingCount,
    limit,
    planType,
}: BuildingsClientProps) {
    const router = useRouter();
    const [buildings, setBuildings] = useState(initialBuildings);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
    const [deleting, setDeleting] = useState(false);

    if (serverError) {
        message.error(serverError);
    }

    const filtered = buildings.filter(
        (b) =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.address?.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (building: Building) => {
        setEditingBuilding(building);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditingBuilding(null);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const result = await deleteBuilding(deleteTarget.id);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Đã xoá toà nhà thành công');
            setBuildings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
        }
        setDeleting(false);
        setDeleteTarget(null);
    };

    const handleSuccess = () => {
        // Reload page to get fresh data from server
        window.location.reload();
    };

    const statusColor = (status: string) =>
        status === 'active' ? 'green' : 'default';

    const statusLabel = (status: string) =>
        status === 'active' ? 'Hoạt động' : 'Tạm ngưng';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {limit !== undefined && (
                <QuotaProgress
                    current={buildingCount ?? buildings.length}
                    limit={limit}
                    entityName="tòa nhà"
                    planType={planType}
                />
            )}

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <SearchInput
                    placeholder="Tìm toà nhà theo tên, địa chỉ..."
                    onSearch={setSearch}
                    style={{ maxWidth: 320 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Thêm toà nhà
                </Button>
            </div>

            {/* Building cards grid */}
            {filtered.length === 0 ? (
                <Card style={{ borderRadius: 12 }}>
                    <Empty
                        description={search ? 'Không tìm thấy toà nhà phù hợp' : 'Chưa có toà nhà nào'}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        {!search && (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                                Thêm toà nhà đầu tiên
                            </Button>
                        )}
                    </Empty>
                </Card>
            ) : (
                <Row gutter={[16, 16]}>
                    {filtered.map((building) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={building.id}>
                            <Card
                                hoverable
                                style={{ borderRadius: 12, height: '100%' }}
                                styles={{ body: { padding: '20px 20px 16px' } }}
                                actions={[
                                    <Tooltip title="Xem phòng" key="view">
                                        <Link href={`/buildings/${building.id}`} onClick={(e) => e.stopPropagation()}>
                                            <EyeOutlined />
                                        </Link>
                                    </Tooltip>,
                                    <Tooltip title="Chỉnh sửa" key="edit">
                                        <EditOutlined
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(building);
                                            }}
                                        />
                                    </Tooltip>,
                                    <Tooltip title="Xoá" key="delete">
                                        <DeleteOutlined
                                            style={{ color: '#ef4444' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget(building);
                                            }}
                                        />
                                    </Tooltip>,
                                ]}
                                onClick={() => router.push(`/buildings/${building.id}`)}
                            >
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 10,
                                                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <HomeOutlined style={{ color: 'white', fontSize: 18 }} />
                                        </div>
                                        <div>
                                            <Typography.Text strong style={{ fontSize: 15 }}>{building.name}</Typography.Text>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <EnvironmentOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                                                <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                                                    {building.address || 'Chưa cập nhật'}
                                                </Typography.Text>
                                            </div>
                                        </div>
                                    </div>
                                    <Tag color={statusColor(building.status)}>{statusLabel(building.status)}</Tag>
                                </div>

                                {/* Stats */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr',
                                        gap: 8,
                                        padding: '12px 0',
                                        borderTop: '1px solid #f0f0f0',
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
                                            {building.room_count ?? 0}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Tổng phòng</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#0d9488' }}>
                                            {building.occupied_count ?? 0}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Đang thuê</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
                                            {building.vacant_count ?? 0}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Trống</div>
                                    </div>
                                </div>

                                {/* Footer info */}
                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 4 }}>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {building.num_floors} tầng
                                        {building.description && ` · ${building.description}`}
                                    </Typography.Text>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Form Modal */}
            <BuildingFormModal
                open={modalOpen}
                building={editingBuilding}
                onClose={() => {
                    setModalOpen(false);
                    setEditingBuilding(null);
                }}
                onSuccess={handleSuccess}
            />

            {/* Delete Confirm */}
            <ConfirmModal
                open={!!deleteTarget}
                title="Xoá toà nhà"
                description={`Bạn có chắc muốn xoá "${deleteTarget?.name}"? Tất cả phòng trong toà nhà cũng sẽ bị xoá. Hành động không thể hoàn tác.`}
                confirmText="Xoá toà nhà"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
