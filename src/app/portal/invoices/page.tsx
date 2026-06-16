import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { Typography, List, Tag, Card } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title } = Typography;

export default async function PortalInvoicesPage() {
    const session = await getTenantSession();
    if (!session || !session.room_id) return null;

    const supabase = createAdminClient();

    const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('room_id', session.room_id)
        .order('created_at', { ascending: false });

    return (
        <div className="p-4 space-y-4">
            <Title level={4}>Danh sách hoá đơn</Title>

            <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={invoices || []}
                renderItem={(item) => (
                    <List.Item>
                        <Link href={`/portal/invoices/${item.id}`}>
                            <Card size="small" hoverable className="w-full">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-50 rounded-full">
                                            <FileTextOutlined className="text-xl text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800">
                                                Hoá đơn tháng {new Date(item.created_at).getMonth() + 1}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Hạn thu: {item.due_date ? new Date(item.due_date).toLocaleDateString('vi-VN') : 'Không có'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-red-500">
                                            {item.total_amount?.toLocaleString()} đ
                                        </div>
                                        <div>
                                            {item.status === 'paid' ? (
                                                <Tag color="success">Đã thu</Tag>
                                            ) : (
                                                <Tag color="error">Chưa thu</Tag>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </List.Item>
                )}
            />
        </div>
    );
}
