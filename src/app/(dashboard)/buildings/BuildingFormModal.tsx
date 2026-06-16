'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import type { Building, BuildingFormData } from '@/types/database';
import { createBuilding, updateBuilding } from './actions';
import PremiumUpgradeModal from '@/components/common/PremiumUpgradeModal';

interface BuildingFormModalProps {
    open: boolean;
    building: Building | null; // null = create mode
    onClose: () => void;
    onSuccess: () => void;
}

export default function BuildingFormModal({ open, building, onClose, onSuccess }: BuildingFormModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState('Tính năng Premium');
    const isEdit = !!building;

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const formData: BuildingFormData = {
                name: values.name,
                address: values.address,
                num_floors: values.num_floors,
                description: values.description,
                status: values.status,
            };

            const result = isEdit
                ? await updateBuilding(building!.id, formData)
                : await createBuilding(formData);

            if (result.requiresUpgrade) {
                setUpgradeFeatureName(result.featureName || 'Không giới hạn tòa nhà');
                setIsUpgradeModalOpen(true);
            } else if (result.error) {
                message.error(result.error);
            } else {
                message.success(isEdit ? 'Cập nhật toà nhà thành công' : 'Thêm toà nhà thành công');
                form.resetFields();
                onClose();
                onSuccess();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title={
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {isEdit ? 'Chỉnh sửa toà nhà' : 'Thêm toà nhà mới'}
                </span>
            }
            okText={isEdit ? 'Cập nhật' : 'Thêm mới'}
            cancelText="Huỷ"
            onOk={handleSubmit}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            confirmLoading={loading}
            centered
            width={520}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={
                    isEdit
                        ? {
                            name: building.name,
                            address: building.address,
                            num_floors: building.num_floors,
                            description: building.description,
                            status: building.status,
                        }
                        : {
                            num_floors: 1,
                            status: 'active',
                        }
                }
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="name"
                    label={<span style={{ fontWeight: 500 }}>Tên toà nhà</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập tên toà nhà' }]}
                >
                    <Input placeholder="VD: Toà A - Chung cư Minh Đức" />
                </Form.Item>

                <Form.Item
                    name="address"
                    label={<span style={{ fontWeight: 500 }}>Địa chỉ</span>}
                >
                    <Input placeholder="VD: 123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM" />
                </Form.Item>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                    <Form.Item
                        name="num_floors"
                        label={<span style={{ fontWeight: 500 }}>Số tầng</span>}
                        rules={[{ required: true, message: 'Nhập số tầng' }]}
                    >
                        <InputNumber min={1} max={50} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label={<span style={{ fontWeight: 500 }}>Trạng thái</span>}
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={[
                                { label: '🟢 Hoạt động', value: 'active' },
                                { label: '⏸ Tạm ngưng', value: 'inactive' },
                            ]}
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="description"
                    label={<span style={{ fontWeight: 500 }}>Mô tả (tuỳ chọn)</span>}
                >
                    <Input.TextArea
                        placeholder="Ghi chú thêm về toà nhà..."
                        rows={3}
                        showCount
                        maxLength={200}
                    />
                </Form.Item>
            </Form>

            <PremiumUpgradeModal
                open={isUpgradeModalOpen}
                onCancel={() => setIsUpgradeModalOpen(false)}
                featureName={upgradeFeatureName}
                description="Gói Free của bạn đã đạt giới hạn tối đa. Nâng cấp lên Premium để quản lý không giới hạn số lượng tòa nhà và phòng."
            />
        </Modal>
    );
}
