'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Select, DatePicker, notification, Alert } from 'antd';
import { generateInvoices, checkMeterReadiness } from '@/app/(dashboard)/invoices/actions';
import { getBuildings } from '@/app/(dashboard)/buildings/actions';
import dayjs from 'dayjs';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialBuildingId?: string;
    initialMonth?: dayjs.Dayjs;
}

export default function GenerateInvoiceModal({ 
    open, 
    onClose, 
    onSuccess,
    initialBuildingId,
    initialMonth,
}: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<{ id: string, name: string }[]>([]);
    const [readiness, setReadiness] = useState<{ total: number; entered: number; missing: string[] } | null>(null);
    const [checkingReadiness, setCheckingReadiness] = useState(false);

    // Declare checkReadiness BEFORE useEffect so it can be used in deps
    const checkReadiness = useCallback(async (buildingId: string, month: string) => {
        if (!buildingId || !month) { setReadiness(null); return; }
        setCheckingReadiness(true);
        const { data } = await checkMeterReadiness(buildingId, month);
        if (data) setReadiness(data);
        setCheckingReadiness(false);
    }, []);

    const fetchBuildings = async () => {
        const { data } = await getBuildings();
        if (data) setBuildings(data);
    };

    useEffect(() => {
        if (open) {
            fetchBuildings();
            form.setFieldsValue({
                building_id: initialBuildingId || undefined,
                month: initialMonth || dayjs()
            });
            // Auto-check readiness with initial values
            if (initialBuildingId && initialMonth) {
                checkReadiness(initialBuildingId, initialMonth.format('YYYY-MM'));
            }
        } else {
            form.resetFields();
            setReadiness(null);
        }
    }, [open, form, initialBuildingId, initialMonth, checkReadiness]);

    const handleValuesChange = (_changed: Record<string, unknown>, all: { building_id?: string; month?: dayjs.Dayjs }) => {
        const bId = all.building_id;
        const m = all.month;
        if (bId && m) {
            checkReadiness(bId, m.format('YYYY-MM'));
        } else {
            setReadiness(null);
        }
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

    const renderReadinessBanner = () => {
        if (!readiness || checkingReadiness) return null;
        const { total, entered, missing } = readiness;
        if (total === 0) return null;

        if (entered === total) {
            return (
                <Alert
                    type="success"
                    showIcon
                    message={`✅ Tất cả ${total} phòng đã chốt chỉ số điện/nước tháng này.`}
                    className="mb-4"
                />
            );
        }
        const missingStr = missing.slice(0, 5).join(', ') + (missing.length > 5 ? ` và ${missing.length - 5} phòng khác` : '');
        return (
            <Alert
                type="warning"
                showIcon
                message={`⚠️ Có ${missing.length}/${total} phòng chưa chốt chỉ số điện/nước (${missingStr}). Tiền điện/nước của các phòng này sẽ tính là 0đ.`}
                className="mb-4"
            />
        );
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
                onValuesChange={handleValuesChange}
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
            {renderReadinessBanner()}
        </Modal>
    );
}
