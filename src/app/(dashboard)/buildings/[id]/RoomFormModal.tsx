'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message, Tabs } from 'antd';
import type { Room, RoomFormData } from '@/types/database';
import { createRoom, updateRoom, bulkCreateMultipleRooms } from './actions';
import PremiumUpgradeModal from '@/components/common/PremiumUpgradeModal';

interface RoomFormModalProps {
    open: boolean;
    room: Room | null;
    buildingId: string;
    numFloors: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RoomFormModal({ open, room, buildingId, numFloors, onClose, onSuccess }: RoomFormModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('single');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState('Tính năng Premium');
    const isEdit = !!room;

    // Reset tab when modal opens
    useEffect(() => {
        if (open) {
            setActiveTab('single');
        }
    }, [open]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (activeTab === 'single') {
                const formData: RoomFormData = {
                    name: values.name,
                    floor: values.floor,
                    area_m2: values.area_m2,
                    room_type: values.room_type,
                    default_rent: values.default_rent,
                    status: values.status,
                    notes: values.notes,
                };

                const result = isEdit
                    ? await updateRoom(room!.id, buildingId, formData)
                    : await createRoom(buildingId, formData);

                if (result.requiresUpgrade) {
                    setUpgradeFeatureName(result.featureName || 'Không giới hạn phòng');
                    setIsUpgradeModalOpen(true);
                } else if (result.error) {
                    message.error(result.error);
                } else {
                    message.success(isEdit ? 'Cập nhật phòng thành công' : 'Thêm phòng thành công');
                    form.resetFields();
                    onClose();
                    onSuccess();
                }
            } else {
                // Bulk creation
                if (!values.bulk_names || values.bulk_names.trim() === '') {
                    message.error('Vui lòng nhập tên các phòng cần thêm');
                    return;
                }

                const rawNames = values.bulk_names.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0);

                // Remove duplicates in the input string itself
                const uniqueNames = Array.from(new Set<string>(rawNames));

                if (uniqueNames.length === 0) {
                    message.error('Vui lòng nhập tên các phòng hợp lệ');
                    return;
                }

                const sharedData: Omit<RoomFormData, 'name'> = {
                    floor: values.floor,
                    area_m2: values.area_m2,
                    room_type: values.room_type,
                    default_rent: values.default_rent,
                    status: values.status,
                    notes: values.notes,
                };

                const result = await bulkCreateMultipleRooms(buildingId, uniqueNames, sharedData);

                if (result.requiresUpgrade) {
                    setUpgradeFeatureName(result.featureName || 'Không giới hạn phòng');
                    setIsUpgradeModalOpen(true);
                } else if (result.error) {
                    message.error({
                        content: result.error,
                        duration: 5 // longer duration for reading the duplicate list
                    });
                } else {
                    message.success(`Đã thêm thành công ${result.count} phòng`);
                    form.resetFields();
                    onClose();
                    onSuccess();
                }
            }
        } catch {
            // form validation error
        } finally {
            setLoading(false);
        }
    };

    const commonFormItems = (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                    name="floor"
                    label={<span style={{ fontWeight: 500 }}>Tầng</span>}
                    rules={[{ required: true, message: 'Chọn tầng' }]}
                >
                    <InputNumber min={1} max={numFloors} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="room_type"
                    label={<span style={{ fontWeight: 500 }}>Loại phòng</span>}
                >
                    <Select
                        options={[
                            { label: 'Đơn', value: 'single' },
                            { label: 'Đôi', value: 'double' },
                            { label: 'Studio', value: 'studio' },
                            { label: 'Khác', value: 'other' },
                        ]}
                    />
                </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                    name="area_m2"
                    label={<span style={{ fontWeight: 500 }}>Diện tích (m²)</span>}
                >
                    <InputNumber min={1} max={500} style={{ width: '100%' }} placeholder="VD: 25" />
                </Form.Item>

                <Form.Item
                    name="default_rent"
                    label={<span style={{ fontWeight: 500 }}>Giá thuê mặc định (đ)</span>}
                >
                    <InputNumber
                        min={0}
                        step={100000}
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        placeholder="VD: 3,500,000"
                    />
                </Form.Item>
            </div>

            <Form.Item
                name="status"
                label={<span style={{ fontWeight: 500 }}>Trạng thái</span>}
            >
                <Select
                    options={[
                        { label: '🔵 Trống', value: 'vacant' },
                        { label: '🟢 Đang thuê', value: 'occupied' },
                        { label: '🟡 Sửa chữa', value: 'maintenance' },
                    ]}
                />
            </Form.Item>

            <Form.Item
                name="notes"
                label={<span style={{ fontWeight: 500 }}>Ghi chú (tuỳ chọn)</span>}
            >
                <Input.TextArea
                    placeholder="Ghi chú thêm..."
                    rows={2}
                    showCount
                    maxLength={200}
                />
            </Form.Item>
        </>
    );

    const singleModeFields = (
        <>
            <Form.Item
                name="name"
                label={<span style={{ fontWeight: 500 }}>Tên phòng</span>}
                rules={activeTab === 'single' ? [{ required: true, message: 'Nhập tên phòng' }] : undefined}
            >
                <Input placeholder="VD: P.101" />
            </Form.Item>
            {commonFormItems}
        </>
    );

    const bulkModeFields = (
        <>
            <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#e6f4ff', borderRadius: 8, border: '1px solid #91caff' }}>
                <span style={{ color: '#0050b3', fontSize: 13, display: 'block' }}>
                    💡 <strong>Mẹo:</strong> Nhập nhiều tên phòng ngăn cách nhau bằng dấu phẩy ( , ). Các phòng này sẽ được áp dụng chung cấu hình (Tầng, Loại, Giá...) ở bên dưới.
                </span>
            </div>
            <Form.Item
                name="bulk_names"
                label={<span style={{ fontWeight: 500 }}>Danh sách tên phòng</span>}
                rules={activeTab === 'bulk' ? [{ required: true, message: 'Nhập danh sách tên phòng' }] : undefined}
            >
                <Input.TextArea
                    placeholder="VD: P101, P102, P103, P201"
                    rows={3}
                />
            </Form.Item>
            {commonFormItems}
        </>
    );

    const tabItems = [
        {
            key: 'single',
            label: 'Thêm 1 phòng',
            children: singleModeFields,
        },
        {
            key: 'bulk',
            label: 'Thêm nhiều phòng',
            children: bulkModeFields,
        }
    ];

    return (
        <Modal
            open={open}
            title={
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {isEdit ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                </span>
            }
            okText={isEdit ? 'Cập nhật' : (activeTab === 'single' ? 'Thêm mới' : 'Thêm hàng loạt')}
            cancelText="Huỷ"
            onOk={handleSubmit}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            confirmLoading={loading}
            centered
            width={560}
            destroyOnClose
            style={activeTab === 'bulk' ? { top: 20 } : {}} // give more top space for bulk tab if needed
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={
                    isEdit
                        ? {
                            name: room.name,
                            floor: room.floor,
                            area_m2: room.area_m2,
                            room_type: room.room_type,
                            default_rent: room.default_rent,
                            status: room.status,
                            notes: room.notes,
                        }
                        : {
                            floor: 1,
                            room_type: 'single',
                            default_rent: 0,
                            status: 'vacant',
                        }
                }
                style={{ marginTop: 16 }}
            >
                {isEdit ? (
                    singleModeFields
                ) : (
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                    />
                )}
            </Form>

            <PremiumUpgradeModal
                open={isUpgradeModalOpen}
                onCancel={() => setIsUpgradeModalOpen(false)}
                featureName={upgradeFeatureName}
                description="Hạn mức số phòng miễn phí của bạn đã đạt giới hạn. Đăng ký Premium ngay để thêm tòa nhà và phòng không giới hạn!"
            />
        </Modal>
    );
}
