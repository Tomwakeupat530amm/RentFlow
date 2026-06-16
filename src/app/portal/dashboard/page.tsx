import React from 'react';
import { getTenantSession } from '@/lib/tenant-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, Typography, List, Tag } from 'antd';
import { FileTextOutlined, WarningOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default async function TenantDashboardPage() {
    const session = await getTenantSession();
    if (!session) return null;

    const supabase = createAdminClient();

    // Lấy thông tin phòng
    let roomInfo = null;
    if (session.room_id) {
        const { data: room } = await supabase
            .from('rooms')
            .select('name, price')
            .eq('id', session.room_id)
            .single();
        roomInfo = room;
    }

    // Lấy hoá đơn chưa thanh toán
    const { data: unpaidInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('room_id', session.room_id)
        .eq('status', 'unpaid')
        .order('created_at', { ascending: false })
        .limit(3);

    // Lấy sự cố gần đây
    const { data: recentIncidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('room_id', session.room_id)
        .order('created_at', { ascending: false })
        .limit(3);

    return (
        <div className="p-4 space-y-6">
            <div className="pt-4">
                <Title level={4} className="!mb-1">Xin chào, {session.name}</Title>
                <Text type="secondary">Phòng: {roomInfo?.name || 'Đang cập nhật'}</Text>
            </div>

            <Card size="small" title="Hoá đơn chưa thanh toán" extra={<Link href="/portal/invoices">Xem tất cả</Link>}>
                {unpaidInvoices && unpaidInvoices.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={unpaidInvoices}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<FileTextOutlined className="text-2xl text-blue-500" />}
                                    title={<Link href={`/portal/invoices/${item.id}`}>{`Hoá đơn tháng ${new Date(item.created_at).getMonth() + 1}`}</Link>}
                                    description={<Text type="danger" strong>{item.total_amount?.toLocaleString()} đ</Text>}
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Text type="secondary">Bạn không có hoá đơn nào chưa thanh toán.</Text>
                )}
            </Card>

            <Card size="small" title="Sự cố gần đây" extra={<Link href="/portal/incidents">Xem tất cả</Link>}>
                {recentIncidents && recentIncidents.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={recentIncidents}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<WarningOutlined className="text-2xl text-orange-500" />}
                                    title={item.title}
                                    description={
                                        <Tag color={
                                            item.status === 'pending' ? 'default' :
                                            item.status === 'in_progress' ? 'processing' : 'success'
                                        }>
                                            {item.status === 'pending' ? 'Chờ xử lý' :
                                             item.status === 'in_progress' ? 'Đang xử lý' : 'Hoàn thành'}
                                        </Tag>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Text type="secondary">Không có sự cố nào gần đây.</Text>
                )}
            </Card>
        </div>
    );
}
