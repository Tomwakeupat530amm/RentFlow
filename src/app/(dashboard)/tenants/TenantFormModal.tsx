'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, message, Upload, Button, Space, Spin } from 'antd';
import {
    UserOutlined, PhoneOutlined, MailOutlined, IdcardOutlined,
    HomeOutlined, UploadOutlined, ScanOutlined, CrownOutlined,
} from '@ant-design/icons';
import type { Tenant, TenantFormData } from '@/types/database';
import { createTenant, updateTenant } from './actions';
import { createClient } from '@/lib/supabase/client';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd/es/upload/interface';

interface Props {
    open: boolean;
    tenant: Tenant | null;
    isPremium?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TenantFormModal({ open, tenant, isPremium = false, onClose, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const isEdit = !!tenant;

    useEffect(() => {
        if (open && tenant?.id_image_url) {
            setFileList([
                {
                    uid: '-1',
                    name: 'CCCD_Image.jpg',
                    status: 'done',
                    url: tenant.id_image_url,
                },
            ]);
        } else if (open && !tenant) {
            setFileList([]);
        }
    }, [open, tenant]);

    const handleScanCCCD = async () => {
        if (fileList.length === 0 || !fileList[0].originFileObj) {
            message.warning('Vui lòng tải ảnh CCCD lên trước khi quét');
            return;
        }

        setScanning(true);
        try {
            const formData = new FormData();
            formData.append('image', fileList[0].originFileObj);

            const response = await fetch('/api/ocr/cccd', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                message.error(result.error || 'Lỗi khi quét CCCD');
                return;
            }

            if (result.message) {
                message.info(result.message);
            }

            const data = result.data;
            const fieldsToUpdate: Record<string, unknown> = {};

            if (data.full_name) fieldsToUpdate.full_name = data.full_name;
            if (data.id_number) fieldsToUpdate.id_number = data.id_number;
            if (data.date_of_birth) fieldsToUpdate.date_of_birth = dayjs(data.date_of_birth);
            if (data.permanent_address) fieldsToUpdate.permanent_address = data.permanent_address;

            if (Object.keys(fieldsToUpdate).length > 0) {
                form.setFieldsValue(fieldsToUpdate);
                message.success(`✨ Đã tự động điền ${Object.keys(fieldsToUpdate).length} trường từ CCCD!`);
            } else {
                message.info('Không trích xuất được thông tin. Vui lòng thử ảnh rõ nét hơn.');
            }
        } catch {
            message.error('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setScanning(false);
        }
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setLoading(true);

        let uploadedUrl = tenant?.id_image_url || undefined;

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
                .from('tenants')
                .upload(fileName, file);

            if (uploadError) {
                message.error('Lỗi tải ảnh lên: ' + uploadError.message);
                setLoading(false);
                return;
            }

            uploadedUrl = `/api/files?bucket=tenants&path=${encodeURIComponent(fileName)}`;
        } else if (fileList.length === 0) {
            uploadedUrl = undefined;
        }

        const formData: TenantFormData = {
            full_name: values.full_name,
            phone: values.phone || undefined,
            email: values.email || undefined,
            id_number: values.id_number || undefined,
            id_image_url: uploadedUrl,
            date_of_birth: values.date_of_birth?.format('YYYY-MM-DD') || undefined,
            permanent_address: values.permanent_address || undefined,
            notes: values.notes || undefined,
        };

        const result = isEdit
            ? await updateTenant(tenant.id, formData)
            : await createTenant(formData);

        if (result.error) {
            message.error(result.error);
        } else {
            message.success(isEdit ? 'Đã cập nhật khách thuê' : 'Đã thêm khách thuê mới');
            form.resetFields();
            setFileList([]);
            onClose();
            onSuccess();
        }

        setLoading(false);
    };

    return (
        <Modal
            title={isEdit ? 'Chỉnh sửa khách thuê' : 'Thêm khách thuê mới'}
            open={open}
            onOk={handleSubmit}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            okText={isEdit ? 'Cập nhật' : 'Thêm mới'}
            cancelText="Huỷ"
            confirmLoading={loading}
            width={520}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={
                    tenant
                        ? {
                            full_name: tenant.full_name,
                            phone: tenant.phone,
                            email: tenant.email,
                            id_number: tenant.id_number,
                            date_of_birth: tenant.date_of_birth ? dayjs(tenant.date_of_birth) : null,
                            permanent_address: tenant.permanent_address,
                            notes: tenant.notes,
                        }
                        : {}
                }
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="full_name"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
                </Form.Item>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                    <Form.Item name="phone" label="Số điện thoại">
                        <Input prefix={<PhoneOutlined />} placeholder="0912345678" />
                    </Form.Item>
                    <Form.Item name="email" label="Email">
                        <Input prefix={<MailOutlined />} placeholder="email@example.com" />
                    </Form.Item>
                </div>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                    <Form.Item name="id_number" label="CCCD/CMND">
                        <Input prefix={<IdcardOutlined />} placeholder="079012345678" />
                    </Form.Item>
                    <Form.Item name="date_of_birth" label="Ngày sinh">
                        <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} />
                    </Form.Item>
                </div>

                <Form.Item label="Ảnh CCCD/CMND (Mặt trước)">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Upload
                            listType="picture"
                            maxCount={1}
                            fileList={fileList}
                            beforeUpload={() => false}
                            onChange={(info) => setFileList(info.fileList)}
                            accept="image/*"
                        >
                            {fileList.length === 0 && (
                                <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                            )}
                        </Upload>

                        {fileList.length > 0 && fileList[0].originFileObj && (
                            isPremium ? (
                                <Button
                                    type="dashed"
                                    icon={scanning ? <Spin size="small" /> : <ScanOutlined />}
                                    onClick={handleScanCCCD}
                                    loading={scanning}
                                    style={{ borderColor: '#faad14', color: '#d48806', background: '#fffbe6' }}
                                >
                                    {scanning ? 'Đang quét...' : '✨ Quét CCCD bằng AI'}
                                </Button>
                            ) : (
                                <Button 
                                    type="dashed" 
                                    icon={<CrownOutlined />} 
                                    onClick={() => Modal.info({
                                        title: '👑 Nâng cấp Premium',
                                        content: 'Tính năng tự động trích xuất thông tin từ CCCD bằng AI chỉ dành cho gói Premium. Nâng cấp ngay để tiết kiệm 90% thời gian nhập liệu!',
                                        okText: 'Đóng',
                                    })}
                                    style={{ opacity: 0.8 }}
                                >
                                    🔒 Quét CCCD bằng AI (Premium)
                                </Button>
                            )
                        )}
                    </Space>
                </Form.Item>

                <Form.Item name="permanent_address" label="Địa chỉ thường trú">
                    <Input prefix={<HomeOutlined />} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
                </Form.Item>

                <Form.Item name="notes" label="Ghi chú">
                    <Input.TextArea rows={2} placeholder="Ghi chú thêm..." />
                </Form.Item>
            </Form>
        </Modal>
    );
}
