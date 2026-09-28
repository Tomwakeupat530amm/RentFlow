'use client';
/* eslint-disable */
// @ts-nocheck

import React from 'react';
import { Card, Tag } from 'antd';
import { FileTextOutlined, WarningOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function DashboardClient({ session, roomInfo, unpaidInvoices, recentIncidents }: any) {
    return (
        <div className="p-4 space-y-6">
            <div className="pt-4">
                <h4 className="text-lg font-bold !mb-1">Xin chào, {session.name}</h4>
                <span className="text-gray-500">Phòng: {roomInfo?.name || 'Đang cập nhật'}</span>
            </div>

            <Card size="small" title="Hoá đơn chưa thanh toán" extra={<Link href="/portal/invoices">Xem tất cả</Link>}>
                {unpaidInvoices && unpaidInvoices.length > 0 ? (
                    <div className="flex flex-col space-y-2">
                        {unpaidInvoices.map((item: any) => (
                            <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                                <FileTextOutlined className="text-2xl text-blue-500" />
                                <div className="flex-1">
                                    <Link href={`/portal/invoices/${item.id}`} className="font-medium text-blue-600 block">
                                        {item.month
                                            ? `Hoá đơn kỳ ${item.month.split('-').slice(0,2).reverse().join('/')}`
                                            : `Hoá đơn tháng ${new Date(item.created_at).getMonth() + 1}`}
                                    </Link>
                                    <span className="text-red-500 font-bold">{item.total_amount?.toLocaleString()} đ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-500">Bạn không có hoá đơn nào chưa thanh toán.</span>
                )}
            </Card>

            <Card size="small" title="Sự cố gần đây" extra={<Link href="/portal/incidents">Xem tất cả</Link>}>
                {recentIncidents && recentIncidents.length > 0 ? (
                    <div className="flex flex-col space-y-2">
                        {recentIncidents.map((item: any) => (
                            <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                                <WarningOutlined className="text-2xl text-orange-500" />
                                <div className="flex-1">
                                    <div className="font-medium">{item.title}</div>
                                    <Tag color={
                                        item.status === 'pending' ? 'default' :
                                        item.status === 'in_progress' ? 'processing' : 'success'
                                    } className="mt-1">
                                        {item.status === 'pending' ? 'Chờ xử lý' :
                                         item.status === 'in_progress' ? 'Đang xử lý' : 'Hoàn thành'}
                                    </Tag>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-500">Không có sự cố nào gần đây.</span>
                )}
            </Card>
        </div>
    );
}
