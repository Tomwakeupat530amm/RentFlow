'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, InputNumber, message, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { Contract, Room, Tenant, ContractFormData } from '@/types/database';
import { createContract, updateContract } from './actions';
import { createClient } from '@/lib/supabase/client';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd/es/upload/interface';

const DURATION_PRESETS = [
    { label: '6 tháng', months: 6 },
    { label: '1 năm', months: 12 },
    { label: '2 năm', months: 24 },
    { label: 'Vô thời hạn', months: null },
];

interface Props {
    open: boolean;
    contract: Contract | null;
    rooms: Room[];
    tenants: Tenant[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function ContractFormModal({ open, contract, rooms, tenants, onClose, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
    const isEdit = !!contract;

    const buildings = Array.from(
        new Map(rooms.filter(r => r.building).map(r => [r.building!.id, r.building])).values()
    );

    useEffect(() => {
        if (open) {
            if (contract?.scan_url) {
                setFileList([
                    {
                        uid: '-1',
                        name: 'Contract_Scan.pdf',
                        status: 'done',
                        url: contract.scan_url,
                    },
                ]);
            } else {
                setFileList([]);
            }

            if (contract?.room_id) {
                const room = rooms.find(r => r.id === contract.room_id);
                if (room?.building?.id) {
                    setSelectedBuildingId(room.building.id);
                }
            } else {
                setSelectedBuildingId(null);
            }
        }
    }, [open, contract, rooms]);

    const handleRoomChange = (roomId: string) => {
        const room = rooms.find(r => r.id === roomId);
        if (room && !form.getFieldValue('rent_amount')) {
            form.setFieldsValue({ rent_amount: room.default_rent });
        }
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setLoading(true);

        let uploadedUrl = contract?.scan_url || undefined;

        // Upload new file to Supabase if exists
        if (fileList.length > 0 && fileList[0].originFileObj) {
            const supabase = createClient();
            const file = fileList[0].originFileObj;
            const fileExt = file.name.split('.').pop();
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('user_profiles').select('org_id').eq('id', user?.id).single();
            const orgId = profile?.org_id;

            if (!orgId) {
                message.error('Không tìm thấy thông tin tổ chức');
                setLoading(false);
                return;
            }

            const fileName = `${orgId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('contracts')
                .upload(fileName, file);

            if (uploadError) {
                message.error('Lỗi tải file lên: ' + uploadError.message);
                setLoading(false);
                return;
            }

            uploadedUrl = `/api/files?bucket=contracts&path=${encodeURIComponent(fileName)}`;
        } else if (fileList.length === 0) {
            uploadedUrl = undefined;
        }

        const formData: ContractFormData & { scan_url?: string } = {
            room_id: values.room_id,
            tenant_id: values.tenant_id,
            rent_amount: values.rent_amount,
            deposit: values.deposit || 0,
            start_date: values.start_date.format('YYYY-MM-DD'),
            end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
            status: values.status,
            notes: values.notes || undefined,
            num_occupants: Number(values.num_occupants || 1),
            num_vehicles: Number(values.num_vehicles || 0),
            scan_url: uploadedUrl,
        };

        const result = isEdit
            ? await updateContract(contract.id, formData)
            : await createContract(formData);

        if (result.error) {
            message.error(result.error);
        } else {
            message.success(isEdit ? 'Đã cập nhật hợp đồng' : 'Đã thêm hợp đồng mới');
            form.resetFields();
            setFileList([]);
            onClose();
            onSuccess();
        }

        setLoading(false);
    };

    return (
        <Modal
            title={isEdit ? 'Chỉnh sửa hợp đồng' : 'Thêm hợp đồng mới'}
            open={open}
            onOk={handleSubmit}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            okText={isEdit ? 'Cập nhật' : 'Tạo mới'}
            cancelText="Huỷ"
            confirmLoading={loading}
            width={600}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={
                    contract
                        ? {
                            room_id: contract.room_id,
                            tenant_id: contract.tenant_id,
                            rent_amount: contract.rent_amount,
                            deposit: contract.deposit,
                            start_date: dayjs(contract.start_date),
                            end_date: contract.end_date ? dayjs(contract.end_date) : null,
                            status: contract.status,
                            notes: contract.notes,
                            num_occupants: contract.num_occupants || 1,
                            num_vehicles: contract.num_vehicles || 0,
                        }
                        : {
                            status: 'active',
                            deposit: 0,
                            num_occupants: 1,
                            num_vehicles: 0,
                        }
                }
                style={{ marginTop: 16 }}
            >
                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                    <Form.Item label="Tòa nhà">
                        <Select
                            placeholder="Chọn tòa nhà"
                            showSearch
                            optionFilterProp="children"
                            value={selectedBuildingId}
                            onChange={(value) => {
                                setSelectedBuildingId(value);
                                form.setFieldsValue({ room_id: undefined, rent_amount: undefined });
                            }}
                            options={buildings.map((b) => ({
                                value: b?.id,
                                label: b?.name,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="room_id"
                        label="Phòng thuê"
                        rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
                    >
                        <Select
                            placeholder="Chọn phòng"
                            showSearch
                            optionFilterProp="children"
                            onChange={handleRoomChange}
                            disabled={!selectedBuildingId}
                            options={rooms
                                .filter(r => r.building?.id === selectedBuildingId)
                                .map((r) => {
                                    const isOccupied = r.status === 'occupied' && (!isEdit || contract?.room_id !== r.id);
                                    return {
                                        value: r.id,
                                        label: `${r.name} ${isOccupied ? '(Đã thuê)' : ''}`,
                                        disabled: isOccupied,
                                    };
                                })}
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="tenant_id"
                    label="Khách thuê đại diện"
                    rules={[{ required: true, message: 'Vui lòng chọn khách thuê' }]}
                >
                    <Select
                        placeholder="Chọn khách thuê"
                        showSearch
                        optionFilterProp="children"
                        options={tenants.map((t) => ({
                            value: t.id,
                            label: `${t.full_name} - ${t.phone || t.id_number || ''}`,
                        }))}
                    />
                </Form.Item>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                    <Form.Item
                        name="rent_amount"
                        label="Giá thuê/tháng (VND)"
                        rules={[{ required: true, message: 'Vui lòng nhập giá thuê' }]}
                    >
                        <InputNumber<number>
                            style={{ width: '100%' }}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                            min={0}
                        />
                    </Form.Item>

                    <Form.Item
                        name="deposit"
                        label="Tiền cọc (VND)"
                    >
                        <InputNumber<number>
                            style={{ width: '100%' }}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                            min={0}
                        />
                    </Form.Item>
                </div>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                    <Form.Item
                        name="num_occupants"
                        label="Số người ở thực tế"
                        tooltip="Dùng để tự động tính các dịch vụ thu theo đầu người (vd: Tiền rác, tiền nước...)"
                    >
                        <InputNumber<number>
                            style={{ width: '100%' }}
                            min={1}
                            placeholder="Mặc định: 1 người"
                        />
                    </Form.Item>

                    <Form.Item
                        name="num_vehicles"
                        label="Số lượng xe máy gửi"
                        tooltip="Dùng để tự động tính phí gửi xe theo số lượng xe của phòng"
                    >
                        <InputNumber<number>
                            style={{ width: '100%' }}
                            min={0}
                            placeholder="Mặc định: 0 xe"
                        />
                    </Form.Item>
                </div>

                <div className="flex flex-col xl:grid xl:grid-cols-3 md:grid md:grid-cols-2 gap-4">
                    <Form.Item
                        name="start_date"
                        label="Ngày bắt đầu"
                        rules={[{ required: true, message: 'Chọn ngày bắt đầu' }]}
                    >
                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="end_date"
                        label="Ngày kết thúc"
                    >
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1">
                                {DURATION_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.label}
                                        size="small"
                                        type="dashed"
                                        onClick={() => {
                                            if (preset.months === null) {
                                                form.setFieldsValue({ end_date: null });
                                            } else {
                                                const startDate = form.getFieldValue('start_date');
                                                if (startDate) {
                                                    form.setFieldsValue({
                                                        end_date: dayjs(startDate).add(preset.months, 'month'),
                                                    });
                                                }
                                            }
                                        }}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Vô thời hạn" />
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Trạng thái"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={[
                                { value: 'active', label: 'Đang hiệu lực' },
                                { value: 'expired', label: 'Hết hạn' },
                                { value: 'terminated', label: 'Thanh lý' },
                            ]}
                        />
                    </Form.Item>
                </div>

                <Form.Item label="Bản scan Hợp đồng (PDF/Image)">
                    <Upload
                        listType="picture"
                        maxCount={1}
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={(info) => {
                            setFileList(info.fileList);
                        }}
                    >
                        {fileList.length === 0 && (
                            <Button icon={<UploadOutlined />}>Tải file lên</Button>
                        )}
                    </Upload>
                </Form.Item>

                <Form.Item name="notes" label="Ghi chú">
                    <Input.TextArea rows={2} placeholder="Ghi chú thêm về hợp đồng..." />
                </Form.Item>
            </Form>
        </Modal>
    );
}
