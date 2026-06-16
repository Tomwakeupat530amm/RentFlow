'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Space, Typography, Popconfirm, Select, DatePicker, Card, notification } from 'antd';
import { EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { getExpenses, deleteExpense } from '@/app/(dashboard)/expenses/actions';
import { getBuildings } from '@/app/(dashboard)/buildings/actions';
import type { Expense } from '@/types/database';
import dayjs from 'dayjs';

import ExpenseFormModal from './ExpenseFormModal';


const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
    'electricity': { label: 'Điện', color: 'orange' },
    'water': { label: 'Nước', color: 'blue' },
    'internet': { label: 'Internet', color: 'cyan' },
    'garbage': { label: 'Rác', color: 'green' },
    'maintenance': { label: 'Bảo trì', color: 'red' },
    'salary': { label: 'Lương', color: 'purple' },
    'marketing': { label: 'Marketing', color: 'magenta' },
    'other': { label: 'Khác', color: 'default' },
};

export default function ExpenseList() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [buildings, setBuildings] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterMonth, setFilterMonth] = useState<string | null>(dayjs().format('YYYY-MM'));
    const [filterBuilding, setFilterBuilding] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // Modals
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const fetchBuildings = useCallback(async () => {
        const { data } = await getBuildings();
        if (data) setBuildings(data);
    }, []);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        const { data, error } = await getExpenses({
            month: filterMonth || undefined,
            building_id: filterBuilding,
            category: filterCategory
        });

        if (error) {
            notification.error({ message: 'Lỗi tải danh sách', description: error });
            setExpenses([]);
        } else {
            setExpenses(data || []);
        }
        setLoading(false);
    }, [filterMonth, filterBuilding, filterCategory]);

    useEffect(() => {
        fetchBuildings();
        fetchExpenses();
    }, [fetchBuildings, fetchExpenses]);

    const handleDelete = async (id: string) => {
        const { error } = await deleteExpense(id);
        if (error) {
            notification.error({ message: 'Lỗi xoá chi phí', description: error });
        } else {
            notification.success({ message: 'Thành công', description: 'Đã xoá chi phí' });
            fetchExpenses();
        }
    };

    const openEdit = (record: Expense) => {
        setSelectedExpense(record);
        setFormModalOpen(true);
    };

    const columns = [
        {
            title: 'Ngày chi',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => <Typography.Text>{dayjs(date).format('DD/MM/YYYY')}</Typography.Text>,
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            render: (cat: string) => {
                const config = CATEGORY_MAP[cat] || CATEGORY_MAP['other'];
                return <Tag color={config.color}>{config.label}</Tag>;
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (text: string, record: Expense) => (
                <div>
                    <div>{text || '---'}</div>
                    {record.building && <Typography.Text type="secondary" className="text-xs">{record.building.name}</Typography.Text>}
                    {!record.building && <Typography.Text type="secondary" className="text-xs">Chung toàn hệ thống</Typography.Text>}
                </div>
            )
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number) => <Typography.Text strong type="danger">-{val.toLocaleString()} đ</Typography.Text>,
            align: 'right' as const
        },
        {
            title: 'Chứng từ',
            dataIndex: 'receipt_url',
            key: 'receipt_url',
            render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">Xem link</a> : '---',
            align: 'center' as const
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: unknown, record: Expense) => (
                <Space size="middle">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    <Popconfirm
                        title="Xoá chi phí này?"
                        description="Bạn có chắc chắn muốn xoá khoản chi này không?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
            align: 'center' as const
        },
    ];

    // Tính tổng chi phí hiện tại trên màn hình
    const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <Space direction="vertical" size="large" className="w-full">
            <Card size="small" className="bg-white shadow-sm border-gray-100 mb-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                    <div className="flex-1 min-w-[150px]">
                        <div className="mb-1 text-xs text-gray-500">Toà nhà:</div>
                        <Select
                            className="w-full"
                            value={filterBuilding}
                            onChange={setFilterBuilding}
                            options={[
                                { value: 'all', label: 'Tất cả / Chung' },
                                ...buildings.map(b => ({ value: b.id, label: b.name }))
                            ]}
                        />
                    </div>
                    <div className="w-full md:flex-1 min-w-[150px]">
                        <div className="mb-1 text-xs text-gray-500">Tháng:</div>
                        <DatePicker
                            className="w-full"
                            picker="month"
                            format="MM/YYYY"
                            value={filterMonth ? dayjs(filterMonth) : null}
                            onChange={(date) => setFilterMonth(date ? date.format('YYYY-MM') : null)}
                            placeholder="Tất cả tháng"
                            allowClear
                        />
                    </div>
                    <div className="w-full md:flex-1 min-w-[150px]">
                        <div className="mb-1 text-xs text-gray-500">Danh mục:</div>
                        <Select
                            className="w-full"
                            value={filterCategory}
                            onChange={setFilterCategory}
                            options={[
                                { value: 'all', label: 'Tất cả' },
                                ...Object.entries(CATEGORY_MAP).map(([key, val]) => ({ value: key, label: val.label }))
                            ]}
                        />
                    </div>
                    <div className="w-full md:w-auto mt-2 md:mt-0">
                        <Button icon={<SyncOutlined />} onClick={fetchExpenses} className="w-full md:w-auto">Làm mới</Button>
                    </div>
                </div>
            </Card>

            <div className="flex justify-end mb-2">
                <Typography.Text strong className="text-lg">Tổng cộng: <Typography.Text type="danger">-{totalAmount.toLocaleString()} đ</Typography.Text></Typography.Text>
            </div>

            <Table
                columns={columns}
                dataSource={expenses}
                rowKey="id"
                loading={loading}
                scroll={{ x: 900 }}
                pagination={{ pageSize: 15, position: ['bottomCenter'], showSizeChanger: true, responsive: true }}
                className="shadow-sm border border-gray-100 rounded-lg overflow-hidden"
            />

            <ExpenseFormModal
                open={formModalOpen}
                initialData={selectedExpense}
                onClose={() => {
                    setFormModalOpen(false);
                    setSelectedExpense(null);
                }}
                onSuccess={fetchExpenses}
            />
        </Space>
    );
}
