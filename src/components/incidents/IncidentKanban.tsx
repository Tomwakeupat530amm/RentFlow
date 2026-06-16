'use client';

import React, { useState, useCallback } from 'react';
import { Card, Tag, Typography, Button, Space, Empty, message, Badge } from 'antd';
import {
    PlusOutlined, ExclamationCircleOutlined,
    ClockCircleOutlined, CheckCircleOutlined, ToolOutlined,
} from '@ant-design/icons';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


interface Incident {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    room_name?: string;
    created_at: string;
}

interface Props {
    incidents: Incident[];
    onStatusChange: (id: string, newStatus: string) => Promise<{ error?: string }>;
    onAdd?: () => void;
}

const COLUMNS = [
    { key: 'open', label: 'Mới', icon: <ExclamationCircleOutlined />, color: '#ff4d4f', bgColor: '#fff2f0' },
    { key: 'in_progress', label: 'Đang xử lý', icon: <ClockCircleOutlined />, color: '#faad14', bgColor: '#fffbe6' },
    { key: 'resolved', label: 'Đã xử lý', icon: <ToolOutlined />, color: '#1890ff', bgColor: '#e6f4ff' },
    { key: 'closed', label: 'Đã đóng', icon: <CheckCircleOutlined />, color: '#52c41a', bgColor: '#f6ffed' },
];

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    high: { color: 'red', label: 'Cao' },
    medium: { color: 'orange', label: 'TB' },
    low: { color: 'blue', label: 'Thấp' },
};

function SortableCard({ incident }: { incident: Incident }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: incident.id,
        data: { status: incident.status },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priority = PRIORITY_CONFIG[incident.priority] || PRIORITY_CONFIG.medium;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card
                size="small"
                style={{
                    marginBottom: 8,
                    borderRadius: 8,
                    cursor: 'grab',
                    border: '1px solid #f0f0f0',
                    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                }}
                styles={{ body: { padding: '10px 12px' } }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Typography.Text strong style={{ fontSize: 13, flex: 1 }} ellipsis>
                        {incident.title}
                    </Typography.Text>
                    <Tag color={priority.color} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                        {priority.label}
                    </Tag>
                </div>
                {incident.room_name && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>📍 {incident.room_name}</Typography.Text>
                )}
                <div style={{ marginTop: 4 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                        {new Date(incident.created_at).toLocaleDateString('vi-VN')}
                    </Typography.Text>
                </div>
            </Card>
        </div>
    );
}

export default function IncidentKanban({ incidents, onStatusChange, onAdd }: Props) {
    const [items, setItems] = useState(incidents);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Determine target column
        const targetColumn = COLUMNS.find(col => col.key === overId);
        const overItem = items.find(i => i.id === overId);
        const targetStatus = targetColumn?.key || overItem?.status;

        if (!targetStatus) return;

        const currentItem = items.find(i => i.id === activeId);
        if (!currentItem || currentItem.status === targetStatus) return;

        // Optimistic update
        setItems(prev => prev.map(i =>
            i.id === activeId ? { ...i, status: targetStatus } : i
        ));

        const result = await onStatusChange(activeId, targetStatus);
        if (result.error) {
            message.error(result.error);
            setItems(prev => prev.map(i =>
                i.id === activeId ? { ...i, status: currentItem.status } : i
            ));
        } else {
            message.success(`Đã chuyển sang "${COLUMNS.find(c => c.key === targetStatus)?.label}"`);
        }
    }, [items, onStatusChange]);

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                minHeight: 400,
                overflowX: 'auto',
            }}>
                {COLUMNS.map(column => {
                    const columnItems = items.filter(i => i.status === column.key);

                    return (
                        <SortableContext
                            key={column.key}
                            items={columnItems.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div
                                style={{
                                    background: column.bgColor,
                                    borderRadius: 12,
                                    padding: 12,
                                    minWidth: 220,
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 12,
                                    padding: '0 4px',
                                }}>
                                    <Space size={6}>
                                        <span style={{ color: column.color }}>{column.icon}</span>
                                        <Typography.Text strong style={{ fontSize: 13 }}>{column.label}</Typography.Text>
                                        <Badge
                                            count={columnItems.length}
                                            style={{ backgroundColor: column.color }}
                                            size="small"
                                        />
                                    </Space>
                                    {column.key === 'open' && onAdd && (
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={onAdd}
                                        />
                                    )}
                                </div>

                                {columnItems.length === 0 ? (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={<Typography.Text type="secondary" style={{ fontSize: 12 }}>Trống</Typography.Text>}
                                        style={{ margin: '20px 0' }}
                                    />
                                ) : (
                                    columnItems.map(item => (
                                        <SortableCard key={item.id} incident={item} />
                                    ))
                                )}
                            </div>
                        </SortableContext>
                    );
                })}
            </div>
        </DndContext>
    );
}
