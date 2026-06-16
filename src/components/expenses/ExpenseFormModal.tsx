'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, notification } from 'antd';
import { createExpense, updateExpense } from '@/app/(dashboard)/expenses/actions';
import { getBuildings } from '@/app/(dashboard)/buildings/actions';
import type { Expense, ExpenseCategory, ExpenseFormData } from '@/types/database';
import dayjs from 'dayjs';

interface ExpenseFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Expense | null;
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
    { value: 'electricity', label: 'Điện' },
    { value: 'water', label: 'Nước' },
    { value: 'internet', label: 'Internet' },
    { value: 'garbage', label: 'Rác' },
    { value: 'maintenance', label: 'Bảo trì / Sửa chữa' },
    { value: 'salary', label: 'Lương nhân viên' },
    { value: 'marketing', label: 'Marketing / Môi giới' },
    { value: 'other', label: 'Khác' },
];

export default function ExpenseFormModal({ open, onClose, onSuccess, initialData }: ExpenseFormModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (open) {
            fetchBuildings();
            if (initialData) {
                form.setFieldsValue({
                    ...initialData,
                    date: dayjs(initialData.date),
                });
            } else {
                form.resetFields();
                form.setFieldValue('date', dayjs());
            }
        }
    }, [open, initialData, form]);

    const fetchBuildings = async () => {
        const { data } = await getBuildings();
        if (data) setBuildings(data);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const formData: ExpenseFormData = {
                ...values,
                date: values.date.format('YYYY-MM-DD'),
            };

            let errorMsg;
            if (initialData) {
                const { error } = await updateExpense(initialData.id, formData);
                errorMsg = error;
            } else {
                const { error } = await createExpense(formData);
                errorMsg = error;
            }

            if (errorMsg) {
                notification.error({ message: 'Lỗi', description: errorMsg });
            } else {
                notification.success({
                    message: 'Thành công',
                    description: `Đã ${initialData ? 'cập nhật' : 'thêm mới'} chi phí.`
                });
                onSuccess();
                onClose();
            }
        } catch (error) {
            // Form validation error
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={initialData ? 'Cập nhật chi phí' : 'Thêm chi phí mới'}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText={initialData ? 'Cập nhật' : 'Thêm mới'}
            cancelText="Huỷ"
            destroyOnClose
        >
            <Form form={form} layout="vertical" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <Form.Item
                        name="building_id"
                        label="Toà nhà (Tuỳ chọn)"
                    >
                        <Select
                            allowClear
                            placeholder="Áp dụng chung nếu để trống"
                            options={buildings.map(b => ({ value: b.id, label: b.name }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="category"
                        label="Danh mục"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                    >
                        <Select
                            placeholder="Chọn danh mục"
                            options={CATEGORIES}
                        />
                    </Form.Item>

                    <Form.Item
                        name="amount"
                        label="Số tiền"
                        rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
                    >
                        <InputNumber
                            className="w-full"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            // @ts-expect-error Antd InputNumber typing bug with min={0}
                            parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, ''))}
                            addonAfter="VND"
                            min={0}
                        />
                    </Form.Item>

                    <Form.Item
                        name="date"
                        label="Ngày chi"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày chi' }]}
                    >
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="description"
                    label="Mô tả chi tiết"
                >
                    <Input.TextArea rows={3} placeholder="Mô tả nội dung chi tiêu..." />
                </Form.Item>

                <Form.Item
                    name="receipt_url"
                    label="Chứng từ / Hoá đơn (URL)"
                >
                    <Input placeholder="Dán link ảnh hoặc Google Drive..." />
                </Form.Item>
            </Form>
        </Modal>
    );
}
