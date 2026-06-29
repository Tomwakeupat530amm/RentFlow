'use client';

import React, { useState } from 'react';
import { Modal, Form, Select, DatePicker, Input, message } from 'antd';
import type { Room, TaskType } from '@/types/database';
import dayjs from 'dayjs';
import { createHousekeepingTask } from './actions';

interface HousekeepingModalProps {
    open: boolean;
    onClose: () => void;
    rooms: Room[];
}

export default function HousekeepingModal({ open, onClose, rooms }: HousekeepingModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: { room_id: string; task_type: string; scheduled_date: dayjs.Dayjs; notes?: string }) => {
        setLoading(true);
        try {
            // Find the building_id from the selected room
            const selectedRoom = rooms.find(r => r.id === values.room_id);
            if (!selectedRoom) {
                message.error('Phòng không hợp lệ');
                return;
            }

            const data = {
                room_id: values.room_id,
                building_id: selectedRoom.building_id,
                task_type: values.task_type as TaskType,
                status: 'pending' as const,
                scheduled_date: values.scheduled_date.format('YYYY-MM-DD'),
                notes: values.notes
            };

            const result = await createHousekeepingTask(data);
            if (result.success) {
                message.success('Đã thêm công việc dọn dẹp');
                form.resetFields();
                onClose();
            } else {
                message.error(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Thêm công việc mới"
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText="Lưu"
            cancelText="Hủy"
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    task_type: 'cleaning',
                    scheduled_date: dayjs()
                }}
            >
                <Form.Item
                    name="room_id"
                    label="Phòng"
                    rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
                >
                    <Select
                        showSearch
                        placeholder="Chọn phòng"
                        optionFilterProp="children"
                        options={rooms.map(room => ({
                            value: room.id,
                            label: room.name
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="task_type"
                    label="Loại công việc"
                    rules={[{ required: true, message: 'Vui lòng chọn loại công việc' }]}
                >
                    <Select
                        options={[
                            { value: 'cleaning', label: 'Dọn dẹp' },
                            { value: 'maintenance', label: 'Bảo trì' },
                            { value: 'inspection', label: 'Kiểm tra' },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    name="scheduled_date"
                    label="Ngày thực hiện"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item
                    name="notes"
                    label="Ghi chú"
                >
                    <Input.TextArea rows={3} placeholder="Nhập ghi chú nếu có..." />
                </Form.Item>
            </Form>
        </Modal>
    );
}
