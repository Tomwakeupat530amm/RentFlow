'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Select, DatePicker, Button, InputNumber, Typography, message, Input, Tag, Grid, Upload, Modal } from 'antd';
import { SaveOutlined, ReloadOutlined, ScanOutlined, CrownOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getMeterRecords, upsertMeterRecords } from './actions';


interface MeterRow {
    room_id: string;
    room_name: string;
    floor: number;
    status: string;
    electricity_old: number;
    electricity_new: number;
    electricity_usage: number;
    water_old: number;
    water_new: number;
    water_usage: number;
    id?: string;
    notes?: string;
}

interface Props {
    buildings: { id: string, name: string }[];
    isPremium?: boolean;
}

export default function MetersClient({ buildings, isPremium = false }: Props) {
    const [buildingId, setBuildingId] = useState<string | null>(buildings[0]?.id || null);
    const [month, setMonth] = useState<Dayjs>(dayjs().startOf('month'));
    const [data, setData] = useState<MeterRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const loadData = useCallback(async () => {
        if (!buildingId) return;
        setLoading(true);
        const monthStr = month.format('YYYY-MM-01');
        const res = await getMeterRecords(buildingId, monthStr);
        if (res.error) {
            message.error(res.error);
        } else {
            setData(res.data);
        }
        setLoading(false);
    }, [buildingId, month]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (index: number, field: keyof MeterRow, val: any) => {
        const newData = [...data];
        const row = { ...newData[index], [field]: val };

        if (field === 'electricity_old' || field === 'electricity_new') {
            const usage = (row.electricity_new || 0) - (row.electricity_old || 0);
            row.electricity_usage = usage > 0 ? usage : 0;
        }
        if (field === 'water_old' || field === 'water_new') {
            const usage = (row.water_new || 0) - (row.water_old || 0);
            row.water_usage = usage > 0 ? usage : 0;
        }

        newData[index] = row;
        setData(newData);
    };

    const handleSave = async () => {
        setSaving(true);
        const monthStr = month.format('YYYY-MM-01');
        const res = await upsertMeterRecords(monthStr, data);
        if (res.error) {
            message.error('Lưu thất bại: ' + res.error);
        } else {
            message.success('Đã lưu chỉ số thành công');
            loadData(); // refresh to get new IDs
        }
        setSaving(false);
    };

    const handleScanMeter = async (file: File, index: number) => {
        if (!isPremium) {
            Modal.info({
                title: '👑 Nâng cấp Premium',
                content: 'Tính năng tự động đọc chỉ số đồng hồ điện nước bằng AI chỉ dành cho gói Premium. Nâng cấp ngay để giảm thiểu sai sót!',
                okText: 'Đóng',
            });
            return false;
        }

        const hide = message.loading('Đang xử lý ảnh...', 0);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/ocr/meter', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) {
                message.error(result.error || 'Lỗi khi quét ảnh');
                return false;
            }

            const parsedData = result.data;
            let updated = false;

            if (parsedData.electricity_new !== undefined) {
                handleChange(index, 'electricity_new', parsedData.electricity_new);
                updated = true;
            }
            if (parsedData.water_new !== undefined) {
                handleChange(index, 'water_new', parsedData.water_new);
                updated = true;
            }

            if (updated) {
                message.success('✨ Đã cập nhật chỉ số từ ảnh!');
            } else {
                message.info('Không nhận diện được chỉ số từ ảnh này.');
            }
        } catch {
            message.error('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            hide();
        }
        return false; // Prevent default upload behavior
    };

    const columns = [
        {
            title: 'Phòng',
            dataIndex: 'room_name',
            key: 'room_name',
            width: 120,
            render: (name: string, record: MeterRow) => (
                <div>
                    <Typography.Text strong>{name}</Typography.Text>
                    <br />
                    {record.status === 'occupied' ? <Tag color="green">Đang thuê</Tag> : <Tag color="default">Trống</Tag>}
                </div>
            )
        },
        {
            title: 'Chỉ số Điện',
            key: 'electricity',
            children: [
                {
                    title: 'Số cũ',
                    dataIndex: 'electricity_old',
                    width: 100,
                    render: (val: number, _: MeterRow, idx: number) => (
                        <InputNumber value={val} min={0} onChange={v => handleChange(idx, 'electricity_old', v || 0)} style={{ width: '100%' }} />
                    )
                },
                {
                    title: 'Số mới',
                    dataIndex: 'electricity_new',
                    width: 100,
                    render: (val: number, _: MeterRow, idx: number) => (
                        <InputNumber value={val} min={0} onChange={v => handleChange(idx, 'electricity_new', v || 0)} style={{ width: '100%' }} />
                    )
                },
                {
                    title: 'Tiêu thụ',
                    dataIndex: 'electricity_usage',
                    width: 90,
                    render: (val: number) => <Typography.Text strong type="danger">{val}</Typography.Text>
                }
            ]
        },
        {
            title: 'Chỉ số Nước',
            key: 'water',
            children: [
                {
                    title: 'Số cũ',
                    dataIndex: 'water_old',
                    width: 100,
                    render: (val: number, _: MeterRow, idx: number) => (
                        <InputNumber value={val} min={0} onChange={v => handleChange(idx, 'water_old', v || 0)} style={{ width: '100%' }} />
                    )
                },
                {
                    title: 'Số mới',
                    dataIndex: 'water_new',
                    width: 100,
                    render: (val: number, _: MeterRow, idx: number) => (
                        <InputNumber value={val} min={0} onChange={v => handleChange(idx, 'water_new', v || 0)} style={{ width: '100%' }} />
                    )
                },
                {
                    title: 'Tiêu thụ',
                    dataIndex: 'water_usage',
                    width: 90,
                    render: (val: number) => <Typography.Text strong style={{ color: '#0d9488' }}>{val}</Typography.Text>
                }
            ]
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 120,
            render: (_: unknown, __: MeterRow, idx: number) => (
                <Upload 
                    accept="image/*" 
                    showUploadList={false} 
                    beforeUpload={(file) => handleScanMeter(file as File, idx)}
                >
                    <Button 
                        size="small" 
                        type="dashed" 
                        icon={isPremium ? <ScanOutlined /> : <CrownOutlined />}
                        style={isPremium ? { borderColor: '#faad14', color: '#d48806' } : {}}
                    >
                        {isPremium ? 'Quét AI' : 'Quét AI'}
                    </Button>
                </Upload>
            )
        }
    ];

    // Hàm hiển thị danh sách dạng Card (Chỉ dùng trên Mobile)
    const renderMobileCards = () => (
        <div className="flex flex-col gap-4 pb-20">
            {data.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl text-gray-400 border border-dashed border-gray-200">Tòa nhà này hiện chưa có phòng nào.</div>
            ) : data.map((record, idx) => (
                <Card
                    key={record.room_id}
                    className={`rounded-xl shadow-sm border-gray-100 ${record.status === 'vacant' ? 'opacity-60 bg-slate-50' : ''}`}
                    styles={{ body: { padding: '16px' } }}
                >
                    <div className="flex justify-between items-center mb-3">
                        <Typography.Text className="text-lg font-bold text-teal-700">{record.room_name}</Typography.Text>
                        {record.status === 'occupied' ? <Tag color="green" className="m-0">Đang thuê</Tag> : <Tag color="default" className="m-0">Trống</Tag>}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                        <div className="flex justify-between items-center mb-2">
                            <Typography.Text strong>⚡ Điện</Typography.Text>
                            <Typography.Text className="text-xs text-gray-500">Số cũ: {record.electricity_old || 0}</Typography.Text>
                        </div>
                        <div className="flex items-center gap-3">
                            <InputNumber
                                value={record.electricity_new}
                                min={0}
                                size="large"
                                className="flex-1"
                                placeholder="Nhập số mới"
                                onChange={v => handleChange(idx, 'electricity_new', v || 0)}
                            />
                            <div className="text-center min-w-[60px]">
                                <div className="text-[10px] text-gray-400">Tiêu thụ</div>
                                <Typography.Text strong className="text-red-500 text-base">{record.electricity_usage || 0}</Typography.Text>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                        <div className="flex justify-between items-center mb-2">
                            <Typography.Text strong>💧 Nước</Typography.Text>
                            <Typography.Text className="text-xs text-gray-500">Số cũ: {record.water_old || 0}</Typography.Text>
                        </div>
                        <div className="flex items-center gap-3">
                            <InputNumber
                                value={record.water_new}
                                min={0}
                                size="large"
                                className="flex-1"
                                placeholder="Nhập số mới"
                                onChange={v => handleChange(idx, 'water_new', v || 0)}
                            />
                            <div className="text-center min-w-[60px]">
                                <div className="text-[10px] text-gray-400">Tiêu thụ</div>
                                <Typography.Text strong className="text-teal-600 text-base">{record.water_usage || 0}</Typography.Text>
                            </div>
                        </div>
                    </div>

                    <Input
                        value={record.notes}
                        placeholder="Ghi chú thêm..."
                        onChange={e => handleChange(idx, 'notes', e.target.value)}
                    />
                </Card>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col gap-4 relative">
            <Card className="rounded-xl shadow-sm border-gray-100" styles={{ body: { padding: isMobile ? '16px' : '20px' } }}>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <Select
                            value={buildingId}
                            onChange={setBuildingId}
                            className="w-full md:w-[200px]"
                            placeholder="Chọn toà nhà"
                            options={buildings.map(b => ({ value: b.id, label: b.name }))}
                        />
                        <div className="flex gap-3 w-full md:w-auto">
                            <DatePicker
                                picker="month"
                                value={month}
                                onChange={(d) => d && setMonth(d.startOf('month'))}
                                format="MM / YYYY"
                                className="flex-1 md:w-[120px]"
                            />
                            <Button icon={<ReloadOutlined />} onClick={loadData} className={isMobile ? "flex-1" : ""}>Tải lại</Button>
                        </div>
                    </div>

                    {!isMobile && (
                        <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                            Lưu chỉ số Điện Nước
                        </Button>
                    )}
                </div>
            </Card>

            {isMobile ? renderMobileCards() : (
                <Table
                    bordered
                    dataSource={data}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    columns={columns as any}
                    rowKey="room_id"
                    loading={loading}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    rowClassName={(r) => r.status === 'vacant' ? 'opacity-50 grayscale bg-slate-50' : ''}
                    locale={{ emptyText: 'Tòa nhà này hiện chưa có phòng nào.' }}
                    className="shadow-sm border border-gray-100 rounded-lg overflow-hidden bg-white"
                />
            )}

            {/* Sticky Mobile Save Button */}
            {isMobile && data.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-50">
                    <Button
                        type="primary"
                        size="large"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={saving}
                        className="w-full h-12 text-base font-semibold bg-teal-600 hover:bg-teal-500 border-none"
                    >
                        Lưu {data.length} phòng
                    </Button>
                </div>
            )}
        </div>
    );
}
