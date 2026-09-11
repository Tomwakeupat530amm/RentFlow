'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Tag, Button, Space, Typography, Tooltip, Popconfirm, Select, DatePicker, Card, notification, Progress } from 'antd';
import { EyeOutlined, DollarOutlined, DeleteOutlined, SyncOutlined, MessageOutlined } from '@ant-design/icons';
import { getInvoices, deleteInvoice } from '@/app/(dashboard)/invoices/actions';
import { getBuildings } from '@/app/(dashboard)/buildings/actions';
import Link from 'next/link';
import dayjs from 'dayjs';
import type { Invoice } from '@/types/database';

import PaymentModal from './PaymentModal';
import ZaloShareModal from './ZaloShareModal';


export default function InvoiceList() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [buildings, setBuildings] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterMonth, setFilterMonth] = useState<string | null>(dayjs().format('YYYY-MM'));
    const [filterBuilding, setFilterBuilding] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Modals
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [zaloModalOpen, setZaloModalOpen] = useState(false);
    const [zaloInvoiceId, setZaloInvoiceId] = useState('');

    const fetchBuildings = useCallback(async () => {
        const { data } = await getBuildings();
        if (data) setBuildings(data);
    }, []);

    const stats = useMemo(() => {
        let totalAmount = 0;
        let totalPaid = 0;
        let unpaidCount = 0;

        invoices.forEach((inv) => {
            const total = Number(inv.total_amount) || 0;
            const paid = Number(inv.paid_amount) || 0;
            totalAmount += total;
            totalPaid += paid;
            if (inv.status !== 'paid') {
                unpaidCount++;
            }
        });

        const totalDebt = Math.max(0, totalAmount - totalPaid);
        const percentCollected = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

        return {
            totalAmount,
            totalPaid,
            totalDebt,
            unpaidCount,
            percentCollected,
            invoiceCount: invoices.length,
        };
    }, [invoices]);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        const { data, error } = await getInvoices({
            month: filterMonth || undefined,
            building_id: filterBuilding,
            status: filterStatus
        });

        if (error) {
            notification.error({ message: 'Lỗi tải danh sách', description: error });
            setInvoices([]);
        } else {
            setInvoices(data || []);
        }
        setLoading(false);
    }, [filterMonth, filterBuilding, filterStatus]);

    useEffect(() => {
        fetchBuildings();
        fetchInvoices();
    }, [fetchBuildings, fetchInvoices]);

    const handleDelete = async (id: string) => {
        const { error } = await deleteInvoice(id);
        if (error) {
            notification.error({ message: 'Lỗi xoá hoá đơn', description: error });
        } else {
            notification.success({ message: 'Thành công', description: 'Đã xoá hoá đơn' });
            fetchInvoices();
        }
    };

    const openPayment = (record: Invoice) => {
        setSelectedInvoice(record);
        setPaymentModalOpen(true);
    };

    const columns = [
        {
            title: 'Tiêu đề / Phòng',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Invoice) => (
                <div>
                    <div className="font-semibold">{record.room?.name || '---'}</div>
                    <Typography.Text type="secondary" className="text-xs">{record.building?.name}</Typography.Text>
                </div>
            )
        },
        {
            title: 'Kỳ thanh toán',
            dataIndex: 'month',
            key: 'month',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
            align: 'center' as const
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (val: number) => <Typography.Text strong>{val.toLocaleString()} đ</Typography.Text>,
            align: 'right' as const
        },
        {
            title: 'Đã trả',
            dataIndex: 'paid_amount',
            key: 'paid_amount',
            render: (val: number, record: Invoice) => {
                const isPaid = Number(val) >= Number(record.total_amount) && Number(record.total_amount) > 0;
                return <Typography.Text type={isPaid ? "success" : "secondary"}>{val.toLocaleString()} đ</Typography.Text>;
            },
            align: 'right' as const
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'gold';
                let label = 'Chưa thanh toán';
                if (status === 'paid') {
                    color = 'green'; label = 'Đã thanh toán';
                } else if (status === 'partial') {
                    color = 'orange'; label = 'Thiếu một phần';
                } else if (status === 'unpaid') {
                    color = 'red'; label = 'Chưa thanh toán';
                }
                return <Tag color={color}>{label}</Tag>;
            },
            align: 'center' as const
        },
        {
            title: 'Hạn chót',
            dataIndex: 'due_date',
            key: 'due_date',
            render: (date: string) => {
                if (!date) return '---';
                const isOverdue = dayjs().isAfter(dayjs(date)) && dayjs().format('YYYY-MM-DD') !== date;
                return <Typography.Text type={isOverdue ? 'danger' : 'secondary'}>{dayjs(date).format('DD/MM/YYYY')}</Typography.Text>;
            },
            align: 'center' as const
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: unknown, record: Invoice) => {
                const isPaid = record.status === 'paid';
                return (
                    <Space size="middle">
                        <Tooltip title="Thu tiền">
                            <Button
                                type="primary"
                                size="small"
                                icon={<DollarOutlined />}
                                onClick={() => openPayment(record)}
                                disabled={isPaid}
                                className={isPaid ? "" : "bg-teal-600 hover:bg-teal-500"}
                            />
                        </Tooltip>
                        <Tooltip title="Gửi Zalo">
                            <Button
                                size="small"
                                icon={<MessageOutlined style={{ color: '#0068ff' }} />}
                                onClick={() => {
                                    setZaloInvoiceId(record.id);
                                    setZaloModalOpen(true);
                                }}
                            />
                        </Tooltip>
                        <Tooltip title="Xem chi tiết">
                            <Link href={`/invoices/${record.id}`}>
                                <Button size="small" icon={<EyeOutlined />} />
                            </Link>
                        </Tooltip>
                        <Tooltip title="Xoá">
                            <Popconfirm
                                title="Xoá hoá đơn này?"
                                description="Bạn có chắc chắn muốn xoá hoá đơn này không?"
                                onConfirm={() => handleDelete(record.id)}
                                okText="Xoá"
                                cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                            >
                                <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                );
            },
            align: 'center' as const
        },
    ];

    return (
        <Space direction="vertical" size="large" className="w-full">
            {/* Financial KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <Card 
                    className="rounded-xl shadow-sm border-gray-100"
                    styles={{ body: { padding: '16px 20px' } }}
                >
                    <div className="text-xs text-gray-500 font-medium">Tổng tiền kỳ này</div>
                    <div className="text-2xl font-bold text-slate-800 mt-1">
                        {stats.totalAmount.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {stats.invoiceCount} hóa đơn phát sinh
                    </div>
                </Card>

                <Card 
                    className="rounded-xl shadow-sm border-gray-100"
                    styles={{ body: { padding: '16px 20px' } }}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-teal-600 font-medium">Đã thu thực tế</span>
                        <Tag color="green" className="m-0 font-semibold">{stats.percentCollected}%</Tag>
                    </div>
                    <div className="text-2xl font-bold text-teal-600 mt-1">
                        {stats.totalPaid.toLocaleString('vi-VN')} đ
                    </div>
                    <Progress 
                        percent={stats.percentCollected} 
                        size="small" 
                        showInfo={false} 
                        strokeColor="#0d9488"
                        className="m-0 mt-2" 
                    />
                </Card>

                <Card 
                    className="rounded-xl shadow-sm border-gray-100"
                    styles={{ body: { padding: '16px 20px' } }}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-red-500 font-medium">Chưa thu / Nợ đọng</span>
                        {stats.unpaidCount > 0 && (
                            <Tag color="red" className="m-0 font-semibold">{stats.unpaidCount} phòng chưa đóng</Tag>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-red-500 mt-1">
                        {stats.totalDebt.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {stats.unpaidCount === 0 ? 'Đã thu đủ 100% tiền phòng' : 'Cần nhắc thu tiền sớm'}
                    </div>
                </Card>
            </div>

            <Card size="small" className="bg-white shadow-sm border-gray-100 mb-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                    <div className="flex-1 min-w-[200px]">
                        <div className="mb-1 text-xs text-gray-500">Toà nhà:</div>
                        <Select
                            className="w-full"
                            value={filterBuilding}
                            onChange={setFilterBuilding}
                            options={[
                                { value: 'all', label: 'Tất cả toà nhà' },
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
                        <div className="mb-1 text-xs text-gray-500">Trạng thái:</div>
                        <Select
                            className="w-full"
                            value={filterStatus}
                            onChange={setFilterStatus}
                            options={[
                                { value: 'all', label: 'Tất cả' },
                                { value: 'unpaid', label: 'Chưa thanh toán' },
                                { value: 'partial', label: 'Thanh toán một phần' },
                                { value: 'paid', label: 'Đã hoàn tất' }
                            ]}
                        />
                    </div>
                    <div className="w-full md:w-auto mt-2 md:mt-0">
                        <Button icon={<SyncOutlined />} onClick={fetchInvoices} className="w-full md:w-auto">Làm mới</Button>
                    </div>
                </div>
            </Card>

            <Table
                columns={columns}
                dataSource={invoices}
                rowKey="id"
                loading={loading}
                scroll={{ x: 900 }}
                pagination={{ pageSize: 15, position: ['bottomCenter'], showSizeChanger: true, responsive: true }}
                className="shadow-sm border border-gray-100 rounded-lg overflow-hidden"
            />

            <PaymentModal
                invoice={selectedInvoice}
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                onSuccess={fetchInvoices}
            />

            <ZaloShareModal
                open={zaloModalOpen}
                onClose={() => {
                    setZaloModalOpen(false);
                    setZaloInvoiceId('');
                }}
                invoiceId={zaloInvoiceId}
            />
        </Space>
    );
}
