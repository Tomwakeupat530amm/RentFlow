'use client';

import React from 'react';
import { Drawer, Form, Input, DatePicker, Select, InputNumber, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { createBooking, updateBooking, deleteBooking } from './actions';
import { message } from 'antd';

import type { Booking, Room } from '@/types/database';

interface BookingModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: Partial<Booking> | null;
    rooms: Room[];
}

interface BookingFormValues {
    room_id: string;
    guest_name: string;
    guest_phone?: string;
    guest_email?: string;
    guest_id_number?: string;
    check_in_date: dayjs.Dayjs;
    check_out_date: dayjs.Dayjs;
    total_amount: number;
    status: Booking['status'];
    payment_status: Booking['payment_status'];
    notes?: string;
}

export default function BookingModal({ open, onClose, initialData, rooms }: BookingModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);

    const onFinish = async (values: BookingFormValues) => {
        setLoading(true);
        try {
            // Find building_id from selected room
            const room = rooms.find(r => r.id === values.room_id);
            if (!room) {
                message.error('Phòng không hợp lệ');
                return;
            }

            const payload = {
                ...values,
                building_id: room.building_id,
                check_in_date: values.check_in_date.format('YYYY-MM-DD'),
                check_out_date: values.check_out_date.format('YYYY-MM-DD')
            };

            if (initialData?.id) {
                const res = await updateBooking(initialData.id, payload);
                if (res?.error) {
                    message.error(res.error);
                } else {
                    message.success('Cập nhật thành công');
                    onClose();
                }
            } else {
                const res = await createBooking(payload);
                if (res?.error) {
                    message.error(res.error);
                } else {
                    message.success('Tạo thành công');
                    onClose();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
        
        setLoading(true);
        try {
            const res = await deleteBooking(initialData.id);
            if (res?.error) {
                message.error(res.error);
            } else {
                message.success('Xóa thành công');
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            title={initialData ? "Chỉnh sửa Booking" : "Tạo Booking mới"}
            width={400}
            onClose={onClose}
            open={open}
            extra={
                <Space>
                    {initialData?.id && (
                        <Button danger onClick={handleDelete} loading={loading}>Xóa</Button>
                    )}
                    <Button onClick={onClose} disabled={loading}>Hủy</Button>
                    <Button type="primary" className="bg-teal-600" onClick={() => form.submit()} loading={loading}>
                        Lưu
                    </Button>
                </Space>
            }
        >
            <Form 
                form={form} 
                layout="vertical" 
                onFinish={onFinish} 
                initialValues={initialData ? {
                    ...initialData,
                    check_in_date: dayjs(initialData.check_in_date),
                    check_out_date: dayjs(initialData.check_out_date)
                } : { 
                    status: 'pending', 
                    payment_status: 'unpaid' 
                }}
            >
                <Form.Item name="room_id" label="Phòng" rules={[{ required: true }]}>
                    <Select placeholder="Chọn phòng">
                        {rooms.map(r => (
                            <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="guest_name" label="Tên khách" rules={[{ required: true }]}>
                    <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                <Form.Item name="guest_phone" label="Số điện thoại">
                    <Input placeholder="0901234567" />
                </Form.Item>
                
                <div className="flex gap-4">
                    <Form.Item name="check_in_date" label="Ngày Check-in" rules={[{ required: true }]} className="flex-1">
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item name="check_out_date" label="Ngày Check-out" rules={[{ required: true }]} className="flex-1">
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                </div>

                <Form.Item name="total_amount" label="Tổng tiền (VNĐ)" rules={[{ required: true }]}>
                    <InputNumber className="w-full" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
                
                <div className="flex gap-4">
                    <Form.Item name="status" label="Trạng thái" className="flex-1">
                        <Select>
                            <Select.Option value="pending">Chờ xác nhận</Select.Option>
                            <Select.Option value="confirmed">Đã xác nhận</Select.Option>
                            <Select.Option value="checked_in">Đang ở</Select.Option>
                            <Select.Option value="checked_out">Đã trả phòng</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="payment_status" label="Thanh toán" className="flex-1">
                        <Select>
                            <Select.Option value="unpaid">Chưa TT</Select.Option>
                            <Select.Option value="partial">TT 1 phần</Select.Option>
                            <Select.Option value="paid">Đã TT đủ</Select.Option>
                        </Select>
                    </Form.Item>
                </div>
                
                <Form.Item name="notes" label="Ghi chú">
                    <Input.TextArea rows={3} placeholder="Ghi chú thêm về khách hoặc phòng" />
                </Form.Item>
            </Form>
        </Drawer>
    );
}
