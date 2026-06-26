'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { createClient } from '@/lib/supabase/client';
import type { Incident, IncidentFormData, Building, Room } from '@/types/database';
import { createIncident, updateIncident } from './actions';

const { TextArea } = Input;


interface IncidentFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    incident?: Incident;
    buildings: Building[];
}

export default function IncidentFormModal({ visible, onClose, onSuccess, incident, buildings }: IncidentFormModalProps) {
    const [form] = Form.useForm<IncidentFormData>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>();

    const supabase = createClient();

    const fetchRooms = React.useCallback(async (buildingId: string) => {
        const { data } = await supabase
            .from('rooms')
            .select('*')
            .eq('building_id', buildingId)
            .order('name');

        if (data) {
            setRooms(data as Room[]);
        }
    }, [supabase]);

    useEffect(() => {
        if (visible) {
            if (incident) {
                form.setFieldsValue({
                    building_id: incident.building_id,
                    room_id: incident.room_id,
                    title: incident.title,
                    description: incident.description || '',
                    priority: incident.priority,
                    status: incident.status,
                    reporter_type: incident.reporter_type,
                    admin_notes: incident.admin_notes || '',
                });
                setSelectedBuildingId(incident.building_id);
                fetchRooms(incident.building_id);

                // Load existing images into fileList
                if (incident.image_urls && incident.image_urls.length > 0) {
                    setFileList(
                        incident.image_urls.map((url, index) => ({
                            uid: `-${index}`,
                            name: `image-${index}.jpg`,
                            status: 'done',
                            url: url,
                        }))
                    );
                } else {
                    setFileList([]);
                }
            } else {
                form.resetFields();
                // Default values for new incident
                form.setFieldsValue({
                    status: 'open',
                    priority: 'medium',
                    reporter_type: 'tenant', // Default to tenant for now
                });
                setFileList([]);
                setRooms([]);
                setSelectedBuildingId(undefined);
            }
        }
    }, [visible, incident, form, fetchRooms]);


    const handleBuildingChange = (value: string) => {
        setSelectedBuildingId(value);
        form.setFieldValue('room_id', undefined);
        fetchRooms(value);
    };

    const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
        setFileList(newFileList);
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        // Loop through all files
        for (const file of fileList) {
            // Already uploaded files have a url property
            if (file.url) {
                uploadedUrls.push(file.url);
                continue;
            }

            if (file.originFileObj) {
                const fileExt = file.name.split('.').pop();
                const fileName = `incident_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `incidents/${fileName}`; // Reusing contracts bucket under 'incidents' folder

                // Using contracts bucket because it's already configured with public read access
                const { error: uploadError } = await supabase.storage
                    .from('contracts')
                    .upload(filePath, file.originFileObj);

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    throw new Error(`Không thể tải ảnh lên: ${uploadError.message}`);
                }

                const { data } = supabase.storage.from('contracts').getPublicUrl(filePath);
                if (data?.publicUrl) {
                    uploadedUrls.push(data.publicUrl);
                }
            }
        }

        return uploadedUrls;
    };

    const handleFinish = async (values: IncidentFormData) => {
        setIsSubmitting(true);
        try {
            // 1. Upload new images if any
            let imageUrls: string[] = [];
            try {
                imageUrls = await uploadImages();
            } catch (error: unknown) {
                if (error instanceof Error) {
                    message.error(error.message);
                } else {
                    message.error('Lỗi upload ảnh');
                }
                setIsSubmitting(false);
                return;
            }

            // 2. Prepare payload
            const payload: IncidentFormData = {
                ...values,
                image_urls: imageUrls.length > 0 ? imageUrls : undefined,
            };

            // 3. Submit
            let result;
            if (incident) {
                result = await updateIncident(incident.id, payload);
            } else {
                result = await createIncident(payload);
            }

            if (result.error) {
                message.error(result.error);
            } else {
                message.success(incident ? 'Cập nhật thành công!' : 'Đã báo cáo sự cố thành công!');
                onClose();
                if (onSuccess) onSuccess();
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                message.error('Lỗi hệ thống: ' + err.message);
            } else {
                message.error('Lỗi hệ thống không xác định');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title={incident ? "Cập nhật sự cố" : "Báo cáo sự cố mới"}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                className="mt-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <Form.Item
                        name="building_id"
                        label="Tòa nhà"
                        rules={[{ required: true, message: 'Vui lòng chọn tòa nhà!' }]}
                    >
                        <Select
                            placeholder="Chọn tòa nhà"
                            onChange={handleBuildingChange}
                        >
                            {buildings.map(b => (
                                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="room_id"
                        label="Phòng (Không bắt buộc)"
                    >
                        <Select
                            placeholder={selectedBuildingId ? "Chọn phòng (Nếu sự cố trong phòng)" : "Vui lòng chọn Tòa nhà trước"}
                            disabled={!selectedBuildingId}
                            allowClear
                        >
                            {rooms.map(r => (
                                <Select.Option key={r.id} value={r.id}>
                                    {r.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item
                    name="title"
                    label="Tiêu đề sự cố"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề ngắn gọn!' }]}
                >
                    <Input placeholder="Ví dụ: Vòi nước bồn rửa mặt bị rò rỉ" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả chi tiết"
                >
                    <TextArea
                        rows={4}
                        placeholder="Mô tả rō hơn về tình trạng, vị trí cụ thể, thời gian phát hiện..."
                    />
                </Form.Item>

                <Form.Item label="Hình ảnh đính kèm (Tối đa 3 ảnh)">
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={handleUploadChange}
                        beforeUpload={() => false} // Prevent automatic upload
                        maxCount={3}
                        accept="image/*"
                    >
                        {fileList.length >= 3 ? null : (
                            <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>Tải ảnh</div>
                            </div>
                        )}
                    </Upload>
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 p-4 bg-gray-50 rounded-lg mb-4">
                    <Form.Item
                        name="priority"
                        label="Mức độ"
                        rules={[{ required: true }]}
                        className="mb-0"
                    >
                        <Select>
                            <Select.Option value="low">Thấp</Select.Option>
                            <Select.Option value="medium">Trung bình</Select.Option>
                            <Select.Option value="high">Nghiêm trọng</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Trạng thái"
                        rules={[{ required: true }]}
                        className="mb-0"
                    >
                        <Select>
                            <Select.Option value="open">Mới báo cáo</Select.Option>
                            <Select.Option value="in_progress">Đang xử lý</Select.Option>
                            <Select.Option value="resolved">Đã giải quyết</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="reporter_type"
                        label="Người báo cáo"
                        rules={[{ required: true }]}
                        className="mb-0"
                    >
                        <Select>
                            <Select.Option value="tenant">Khách thuê</Select.Option>
                            <Select.Option value="owner">Ban quản lý</Select.Option>
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item
                    name="admin_notes"
                    label="Ghi chú nội bộ (Chỉ Ban quản lý thấy)"
                >
                    <TextArea rows={2} placeholder="Ghi chú về chi phí, thợ sữa,..." />
                </Form.Item>

                <div className="flex justify-end gap-2 mt-6">
                    <Button onClick={onClose} disabled={isSubmitting}>Hủy</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        style={{ backgroundColor: '#0d9488' }}
                    >
                        {incident ? 'Lưu thay đổi' : 'Gửi báo cáo'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
