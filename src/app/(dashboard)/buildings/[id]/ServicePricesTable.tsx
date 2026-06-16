'use client';

import React, { useState, useEffect } from 'react';
import { Table, Input, InputNumber, Switch, Button, message, Select } from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import type { ServicePrice, ServicePriceFormData, ServiceType } from '@/types/database';
import { upsertServicePrices } from './actions';

interface Props {
    buildingId: string;
    initialPrices: ServicePrice[];
}

const defaultServices: { type: ServiceType; label: string; unit: string; is_metered: boolean }[] = [
    { type: 'electricity', label: 'Điện', unit: 'kWh', is_metered: true },
    { type: 'water', label: 'Nước', unit: 'm3', is_metered: true },
    { type: 'internet', label: 'Internet', unit: 'phòng/tháng', is_metered: false },
    { type: 'garbage', label: 'Rác', unit: 'phòng/tháng', is_metered: false },
    { type: 'parking', label: 'Gửi xe', unit: 'xe/tháng', is_metered: false },
];

export default function ServicePricesTable({ buildingId, initialPrices }: Props) {
    const [prices, setPrices] = useState<ServicePriceFormData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialPrices.length > 0) {
            setPrices(initialPrices.map(p => ({
                building_id: p.building_id,
                service_type: p.service_type,
                label: p.label,
                unit_price: p.unit_price,
                unit: p.unit,
                is_metered: p.is_metered
            })));
        } else {
            // Populate defaults if empty
            setPrices(defaultServices.map(ds => ({
                building_id: buildingId,
                service_type: ds.type,
                label: ds.label,
                unit_price: 0,
                unit: ds.unit,
                is_metered: ds.is_metered
            })));
        }
    }, [initialPrices, buildingId]);

    const handleChange = (index: number, key: keyof ServicePriceFormData, value: string | number | boolean) => {
        const newData = [...prices];
        newData[index] = { ...newData[index], [key]: value };
        setPrices(newData);
    };

    const handleAdd = () => {
        setPrices([
            ...prices,
            {
                building_id: buildingId,
                service_type: 'other',
                label: 'Dịch vụ khác',
                unit_price: 0,
                unit: '',
                is_metered: false
            }
        ]);
    };

    const handleDelete = (index: number) => {
        const newData = [...prices];
        newData.splice(index, 1);
        setPrices(newData);
    };

    const handleSave = async () => {
        setLoading(true);
        const result = await upsertServicePrices(buildingId, prices);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Đã lưu cấu hình bảng giá');
        }
        setLoading(false);
    };

    const columns = [
        {
            title: 'Loại dịch vụ',
            dataIndex: 'service_type',
            width: 150,
            render: (val: string, record: ServicePriceFormData, index: number) => (
                <Select
                    value={val}
                    onChange={(v) => handleChange(index, 'service_type', v)}
                    style={{ width: '100%' }}
                    options={[
                        { value: 'electricity', label: 'Điện', disabled: prices.some((p, i) => i !== index && p.service_type === 'electricity') },
                        { value: 'water', label: 'Nước', disabled: prices.some((p, i) => i !== index && p.service_type === 'water') },
                        { value: 'internet', label: 'Internet', disabled: prices.some((p, i) => i !== index && p.service_type === 'internet') },
                        { value: 'garbage', label: 'Rác', disabled: prices.some((p, i) => i !== index && p.service_type === 'garbage') },
                        { value: 'parking', label: 'Gửi xe', disabled: prices.some((p, i) => i !== index && p.service_type === 'parking') },
                        { value: 'other', label: 'Khác' },
                    ]}
                />
            )
        },
        {
            title: 'Tên hiển thị',
            dataIndex: 'label',
            width: 200,
            render: (val: string, record: ServicePriceFormData, index: number) => (
                <Input value={val} onChange={(e) => handleChange(index, 'label', e.target.value)} />
            )
        },
        {
            title: 'Đơn giá (VND)',
            dataIndex: 'unit_price',
            width: 150,
            render: (val: number, record: ServicePriceFormData, index: number) => (
                <InputNumber
                    style={{ width: '100%' }}
                    value={val}
                    onChange={(v) => handleChange(index, 'unit_price', v || 0)}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                    min={0}
                />
            )
        },
        {
            title: 'Đơn vị tính',
            dataIndex: 'unit',
            width: 120,
            render: (val: string, record: ServicePriceFormData, index: number) => (
                <Input value={val} onChange={(e) => handleChange(index, 'unit', e.target.value)} placeholder="kWh, m3, tháng..." />
            )
        },
        {
            title: 'Ghi số công tơ',
            dataIndex: 'is_metered',
            width: 120,
            align: 'center' as const,
            render: (val: boolean, record: ServicePriceFormData, index: number) => (
                <Switch
                    checked={val}
                    onChange={(v) => handleChange(index, 'is_metered', v)}
                    disabled={record.service_type === 'electricity' || record.service_type === 'water'}
                />
            )
        },
        {
            title: '',
            key: 'action',
            width: 50,
            align: 'center' as const,
            render: (_: unknown, __: unknown, index: number) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(index)} />
            )
        }
    ];

    return (
        <div style={{ padding: '0 16px 16px' }}>
            <Table
                dataSource={prices}
                columns={columns}
                rowKey={(r, idx) => idx?.toString() || ''}
                pagination={false}
                size="middle"
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />}>
                    Thêm dịch vụ
                </Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                    Lưu bảng giá
                </Button>
            </div>
        </div>
    );
}
