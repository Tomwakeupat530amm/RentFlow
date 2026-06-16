'use client';
/* eslint-disable */
// @ts-nocheck

import React from 'react';
import { Typography, Card, Button, Divider } from 'antd';
import { UserOutlined, PhoneOutlined, KeyOutlined, LogoutOutlined } from '@ant-design/icons';
import { redirect } from 'next/navigation';

export default function ProfileClient({ session, handleLogout }: any) {
    return (
        <div className="p-4 space-y-6">
            <Typography.Title level={4}>Tài khoản</Typography.Title>

            <Card className="shadow-sm">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <UserOutlined className="text-3xl text-blue-500" />
                    </div>
                    <Typography.Title level={5} className="!mb-0">{session.name}</Typography.Title>
                    <Typography.Text type="secondary">Khách thuê</Typography.Text>
                </div>

                <Divider className="my-4" />

                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <PhoneOutlined className="text-gray-400 text-lg" />
                        <div>
                            <Typography.Text type="secondary" className="block text-xs">Số điện thoại</Typography.Text>
                            <Typography.Text strong>{session.phone}</Typography.Text>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <KeyOutlined className="text-gray-400 text-lg" />
                        <div>
                            <Typography.Text type="secondary" className="block text-xs">Mã phòng</Typography.Text>
                            <Typography.Text strong>{session.room_id || 'Chưa xếp phòng'}</Typography.Text>
                        </div>
                    </div>
                </div>
            </Card>

            <form action={handleLogout}>
                <Button 
                    type="primary" 
                    danger 
                    block 
                    size="large" 
                    icon={<LogoutOutlined />}
                >
                    Đăng xuất
                </Button>
            </form>
        </div>
    );
}
