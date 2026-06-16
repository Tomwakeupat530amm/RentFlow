'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, notification } from 'antd';
import { generateInvoices } from '@/app/(dashboard)/invoices/actions';
import { getBuildings } from '@/app/(dashboard)/buildings/actions';
import dayjs from 'dayjs';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function GenerateInvoiceModal({ open, onClose, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        if (open) {
            fetchBuildings();
            form.setFieldsValue({
                month: dayjs()
            });
        } else {
            form.resetFields();
        }
    }, [open, form]);

    const fetchBuildings = async () => {
        const { data } = await getBuildings();
        if (data) setBuildings(data);
    };

    const handleSubmit = async (values: { building_id: string, month: dayjs.Dayjs }) => {
        setLoading(true);
        try {
            const monthStr = values.month.format('YYYY-MM');
            const { error, message: successMsg } = await generateInvoices(values.building_id, monthStr);

            if (error) {
                notification.error({
                    message: 'Lỗi tạo hoá đơn',
                    description: error,
                });
            } else {
                notification.success({
                    message: 'Thành công',
                    description: successMsg,
                });
                onSuccess();
                onClose();
            }
        } catch (err: unknown) {
            notification.error({
                message: 'Lỗi',
                description: (err as Error).message || 'Đã xảy ra lỗi không xác định',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Tạo Hoá Đơn Hàng Loạt"
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText="Tạo tự động"
            cancelText="Huỷ"
            destroyOnHidden
            maskClosable={false}
        >
            <div className="mb-4 text-gray-500">
                Chức năng này sẽ tự động tạo hoá đơn cho tất cả các phòng đang có hợp đồng hoạt động (bao gồm tiền phòng, điện nước và các phí cố định).
            </div>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="building_id"
                    label="Chọn Toà Nhà"
                    rules={[{ required: true, message: 'Vui lòng chọn toà nhà' }]}
                >
                    <Select
                        placeholder="-- Chọn toà nhà --"
                        options={buildings.map(b => ({ label: b.name, value: b.id }))}
                    />
                </Form.Item>

                <Form.Item
                    name="month"
                    label="Kỳ tính tiền (Tháng/Năm)"
                    rules={[{ required: true, message: 'Vui lòng chọn kỳ tính tiền' }]}
                >
                    <DatePicker
                        picker="month"
                        format="MM/YYYY"
                        className="w-full"
                        placeholder="Chọn tháng"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
