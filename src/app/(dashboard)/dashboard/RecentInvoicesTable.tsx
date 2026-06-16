'use client';

import React from 'react';
import { Typography, Card, Table, Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import StatusTag from '@/components/common/StatusTag';


const recentInvoices = [
    { key: '1', room: 'P.101 — Toà A', tenant: 'Nguyễn Văn An', amount: '4,500,000', status: 'paid' },
    { key: '2', room: 'P.202 — Toà B', tenant: 'Trần Thị Bình', amount: '5,200,000', status: 'pending' },
    { key: '3', room: 'P.305 — Toà A', tenant: 'Lê Văn Cường', amount: '3,800,000', status: 'overdue' },
    { key: '4', room: 'P.104 — Toà C', tenant: 'Phạm Minh Đức', amount: '4,100,000', status: 'paid' },
    { key: '5', room: 'P.201 — Toà B', tenant: 'Hoàng Thị Lan', amount: '3,600,000', status: 'pending' },
];

const columns = [
    {
        title: 'Phòng',
        dataIndex: 'room',
        key: 'room',
        render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    { title: 'Khách thuê', dataIndex: 'tenant', key: 'tenant' },
    {
        title: 'Số tiền (đ)',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right' as const,
        render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => <StatusTag status={status} />,
    },
];

export default function RecentInvoicesTable() {
    return (
        <Card
            variant="borderless"
            style={{ borderRadius: 12 }}
            title={<span style={{ fontWeight: 700, fontSize: 15 }}>Hoá đơn gần đây</span>}
            extra={
                <Button type="link" icon={<ArrowRightOutlined />} iconPosition="end">
                    Xem tất cả
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={recentInvoices}
                pagination={false}
                size="middle"
            />
        </Card>
    );
}
