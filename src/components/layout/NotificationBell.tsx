'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, MenuProps, Spin, Button, message } from 'antd';
import { BellOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
dayjs.extend(relativeTime);
import type { Reminder } from '@/types/database';

export default function NotificationBell({ userId }: { userId: string }) {
    const supabase = createClient();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(false);
    const [orgId, setOrgId] = useState<string | null>(null);

    // Fetch orgId for the current user
    useEffect(() => {
        const fetchOrgId = async () => {
            const { data } = await supabase
                .from('user_profiles')
                .select('org_id')
                .eq('id', userId)
                .single();

            if (data?.org_id) {
                setOrgId(data.org_id);
            }
        };

        if (userId) fetchOrgId();
    }, [userId, supabase]);

    // Fetch reminders once org_id is available
    useEffect(() => {
        if (!orgId) return;

        const fetchReminders = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('reminders')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                setReminders(data);
            }
            setLoading(false);
        };

        fetchReminders();

        // Subscribe to new reminders
        const channel = supabase
            .channel('reminders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reminders',
                    filter: `org_id=eq.${orgId}`,
                },
                () => {
                    fetchReminders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId, supabase]);

    const markAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { error } = await supabase
            .from('reminders')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setReminders(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
        } else {
            message.error('Không thể đánh dấu đã đọc');
        }
    };

    const markAllAsRead = async () => {
        if (!orgId) return;
        const unreadIds = reminders.filter(r => !r.is_read).map(r => r.id);
        if (unreadIds.length === 0) return;

        const { error } = await supabase
            .from('reminders')
            .update({ is_read: true })
            .in('id', unreadIds);

        if (!error) {
            setReminders(prev => prev.map(r => ({ ...r, is_read: true })));
            message.success('Đã đánh dấu tất cả là đã đọc');
        } else {
            message.error('Lỗi khi cập nhật');
        }
    };

    const unreadCount = reminders.filter(r => !r.is_read).length;

    const items: MenuProps['items'] = [
        {
            key: 'header',
            label: (
                <div className="flex justify-between items-center w-full min-w-[300px] px-2 py-1">
                    <span className="font-semibold text-gray-700">Thông báo</span>
                    <Button type="link" size="small" onClick={markAllAsRead} disabled={unreadCount === 0}>
                        Đánh dấu đã đọc
                    </Button>
                </div>
            ),
        },
        { type: 'divider' },
        ...(loading
            ? [{ key: 'loading', label: <div className="text-center py-4"><Spin /></div> }]
            : reminders.length === 0
                ? [{ key: 'empty', label: <div className="text-center py-4 text-gray-500">Không có thông báo nào</div> }]
                : reminders.map(reminder => ({
                    key: reminder.id,
                    className: reminder.is_read ? 'opacity-60' : 'bg-blue-50/50',
                    label: (
                        <div className="flex justify-between items-start gap-4 py-2 w-full min-w-[300px] whitespace-normal">
                            <div className="flex-1">
                                <div className="text-sm font-medium mb-1">{reminder.message}</div>
                                <div className="text-xs text-gray-400">
                                    {dayjs(reminder.created_at).locale('vi').fromNow()}
                                    {reminder.due_date && ` • Hạn: ${dayjs(reminder.due_date).format('DD/MM/YYYY')}`}
                                </div>
                            </div>
                            {!reminder.is_read && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CheckCircleOutlined />}
                                    onClick={(e) => markAsRead(reminder.id, e)}
                                    title="Đánh dấu đã đọc"
                                />
                            )}
                        </div>
                    )
                }))
        )
    ];

    return (
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" overlayClassName="rounded-lg shadow-lg">
            <Badge count={unreadCount} size="small" offset={[-4, 4]}>
                <div className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                    <BellOutlined className="text-xl text-gray-600" />
                </div>
            </Badge>
        </Dropdown>
    );
}
