'use client';
/* eslint-disable */
// @ts-nocheck

import React from 'react';
import { Typography, List, Tag, Card, Button } from 'antd';
import { PlusOutlined, WarningOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function IncidentsClient({ session, incidents }: any) {
    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <Typography.Title level={4} className="!mb-0">Báo cáo sự cố</Typography.Title>
                <Link href="/portal/incidents/new">
                    <Button type="primary" icon={<PlusOutlined />} shape="circle" />
                </Link>
            </div>

            <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={incidents || []}
                renderItem={(item: any) => (
                    <List.Item>
                        <Card size="small" className="w-full">
                            <div className="flex items-start space-x-3">
                                <div className="p-2 bg-orange-50 rounded-full mt-1">
                                    <WarningOutlined className="text-xl text-orange-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <div className="font-semibold text-gray-800">
                                            {item.title}
                                        </div>
                                        <Tag color={
                                            item.status === 'pending' ? 'default' :
                                            item.status === 'in_progress' ? 'processing' : 'success'
                                        }>
                                            {item.status === 'pending' ? 'Chờ xử lý' :
                                             item.status === 'in_progress' ? 'Đang xử lý' : 'Hoàn thành'}
                                        </Tag>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {item.description}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        Ngày báo: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </List.Item>
                )}
            />
        </div>
    );
}
