import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { Typography, Card, Button, Divider } from 'antd';
import { UserOutlined, PhoneOutlined, KeyOutlined, LogoutOutlined } from '@ant-design/icons';
import { clearTenantSession } from '@/lib/tenant-auth';
import { redirect } from 'next/navigation';

const { Title, Text } = Typography;

export default async function PortalProfilePage() {
    const session = await getTenantSession();
    if (!session) return null;

    const handleLogout = async () => {
        'use server';
        await clearTenantSession();
        redirect('/portal/login');
    };

    return (
        <div className="p-4 space-y-6">
            <Title level={4}>Tài khoản</Title>

            <Card className="shadow-sm">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <UserOutlined className="text-3xl text-blue-500" />
                    </div>
                    <Title level={5} className="!mb-0">{session.name}</Title>
                    <Text type="secondary">Khách thuê</Text>
                </div>

                <Divider className="my-4" />

                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <PhoneOutlined className="text-gray-400 text-lg" />
                        <div>
                            <Text type="secondary" className="block text-xs">Số điện thoại</Text>
                            <Text strong>{session.phone}</Text>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <KeyOutlined className="text-gray-400 text-lg" />
                        <div>
                            <Text type="secondary" className="block text-xs">Mã phòng</Text>
                            <Text strong>{session.room_id || 'Chưa xếp phòng'}</Text>
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
