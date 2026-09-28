'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Modal, Form, InputNumber, Select, Button, Typography, Space, Table,
    Tag, message, Divider, Alert, Row, Col,
} from 'antd';
import { AppstoreAddOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { batchCreateRooms, BatchRoomInput } from './actions';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    buildingId: string;
    buildingName: string;
}

export default function BatchRoomModal({
    open,
    onClose,
    onSuccess,
    buildingId,
    buildingName,
}: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Form states for live preview
    const [startFloor, setStartFloor] = useState<number>(1);
    const [endFloor, setEndFloor] = useState<number>(3);
    const [roomsPerFloor, setRoomsPerFloor] = useState<number>(4);
    const [defaultRent, setDefaultRent] = useState<number>(3500000);
    const [area, setArea] = useState<number>(25);
    const [roomType, setRoomType] = useState<string>('single');
    const [namingStyle, setNamingStyle] = useState<'standard' | 'prefix_p' | 'prefix_dot'>('standard');

    // Generate room list based on form inputs
    const previewRooms = useMemo(() => {
        const list: (BatchRoomInput & { key: string })[] = [];
        if (startFloor > endFloor || roomsPerFloor <= 0) return list;

        for (let f = startFloor; f <= endFloor; f++) {
            for (let r = 1; r <= roomsPerFloor; r++) {
                const roomNum = r < 10 ? `0${r}` : `${r}`;
                let name = `${f}${roomNum}`;
                if (namingStyle === 'prefix_p') name = `P${f}${roomNum}`;
                if (namingStyle === 'prefix_dot') name = `P.${f}${roomNum}`;

                const key = `${f}-${r}-${name}`;
                list.push({
                    key,
                    name,
                    floor: f,
                    default_rent: defaultRent,
                    area,
                    area_m2: area,
                    room_type: roomType,
                });
            }
        }
        return list;
    }, [startFloor, endFloor, roomsPerFloor, defaultRent, area, roomType, namingStyle]);

    // Select all by default when list changes
    useEffect(() => {
        if (open) {
            setSelectedRowKeys(previewRooms.map(r => r.key));
        }
    }, [open, previewRooms]);

    const handleSubmit = async () => {
        const roomsToCreate = previewRooms
            .filter(r => selectedRowKeys.includes(r.key))
            .map(({ name, floor, default_rent, area: rArea, room_type }) => ({
                name,
                floor,
                default_rent,
                area_m2: rArea,
                room_type,
            }));

        if (roomsToCreate.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 phòng để tạo');
            return;
        }

        setLoading(true);
        try {
            const res = await batchCreateRooms(buildingId, roomsToCreate);
            if (res.error) {
                message.error(res.error);
            } else {
                message.success(`✨ Đã tạo thành công ${res.count} phòng cho toà nhà ${buildingName}!`);
                if (res.duplicates && res.duplicates.length > 0) {
                    message.info(`Bỏ qua ${res.duplicates.length} phòng đã tồn tại: ${res.duplicates.join(', ')}`);
                }
                onSuccess();
                onClose();
            }
        } catch {
            message.error('Lỗi khi gửi yêu cầu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Tên phòng',
            dataIndex: 'name',
            key: 'name',
            render: (val: string) => <Typography.Text strong style={{ color: '#0d9488' }}>{val}</Typography.Text>,
        },
        {
            title: 'Tầng',
            dataIndex: 'floor',
            key: 'floor',
            render: (val: number) => <Tag color="blue">Tầng {val}</Tag>,
        },
        {
            title: 'Giá thuê mặc định',
            dataIndex: 'default_rent',
            key: 'default_rent',
            render: (val: number) => `${val?.toLocaleString('vi-VN')} đ`,
        },
        {
            title: 'Diện tích',
            dataIndex: 'area',
            key: 'area',
            render: (val: number) => `${val} m²`,
        },
    ];

    return (
        <Modal
            title={
                <Space>
                    <AppstoreAddOutlined style={{ color: '#0d9488', fontSize: 20 }} />
                    <span style={{ fontWeight: 700, fontSize: 17 }}>
                        Tạo nhanh dãy phòng - {buildingName}
                    </span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            width={780}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Đóng
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={loading}
                    onClick={handleSubmit}
                    style={{ background: '#0d9488' }}
                >
                    Khởi tạo {selectedRowKeys.length} phòng
                </Button>,
            ]}
        >
            <Alert
                message="Tự động sinh hàng loạt phòng theo tầng giúp bạn tiết kiệm 95% thời gian thiết lập toà nhà mới."
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
            />

            <Form form={form} layout="vertical">
                <Row gutter={16}>
                    <Col xs={12} sm={6}>
                        <Form.Item label="Từ tầng">
                            <InputNumber
                                min={1}
                                max={50}
                                value={startFloor}
                                onChange={(v) => setStartFloor(v || 1)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Form.Item label="Đến tầng">
                            <InputNumber
                                min={startFloor}
                                max={50}
                                value={endFloor}
                                onChange={(v) => setEndFloor(v || startFloor)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Form.Item label="Số phòng / tầng">
                            <InputNumber
                                min={1}
                                max={30}
                                value={roomsPerFloor}
                                onChange={(v) => setRoomsPerFloor(v || 1)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Form.Item label="Kiểu đặt tên">
                            <Select
                                value={namingStyle}
                                onChange={setNamingStyle}
                                options={[
                                    { value: 'standard', label: '101, 102...' },
                                    { value: 'prefix_p', label: 'P101, P102...' },
                                    { value: 'prefix_dot', label: 'P.101, P.102...' },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={10}>
                        <Form.Item label="Giá thuê mặc định (VNĐ/tháng)">
                            <InputNumber
                                min={0}
                                step={100000}
                                value={defaultRent}
                                onChange={(v) => setDefaultRent(v || 0)}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={12} sm={7}>
                        <Form.Item label="Diện tích (m²)">
                            <InputNumber
                                min={5}
                                value={area}
                                onChange={(v) => setArea(v || 20)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={12} sm={7}>
                        <Form.Item label="Loại phòng">
                            <Select
                                value={roomType}
                                onChange={setRoomType}
                                options={[
                                    { value: 'single', label: 'Phòng đơn' },
                                    { value: 'double', label: 'Phòng đôi' },
                                    { value: 'studio', label: 'Căn Studio' },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            <Divider orientation="left" style={{ margin: '12px 0 16px' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                    Xem trước ({previewRooms.length} phòng được sinh ra - Bạn có thể bỏ chọn phòng không dùng):
                </span>
            </Divider>

            <Table
                rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                }}
                columns={columns}
                dataSource={previewRooms}
                pagination={{ pageSize: 8, size: 'small' }}
                size="small"
                scroll={{ y: 240 }}
            />
        </Modal>
    );
}
