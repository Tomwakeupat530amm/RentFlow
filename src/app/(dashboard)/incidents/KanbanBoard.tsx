'use client';

import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Typography, Tag, Button, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, SyncOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Incident, IncidentStatus, IncidentPriority } from '@/types/database';


interface KanbanCardProps {
    incident: Incident;
    isOwner: boolean;
    onEdit: (incident: Incident) => void;
    onDelete: (id: string) => void;
}

const KanbanCard = ({ incident, isOwner, onEdit, onDelete }: KanbanCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: incident.id,
        data: {
            type: 'Incident',
            incident,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        marginBottom: '12px',
        cursor: 'grab',
    };

    const getPriorityTag = (priority: IncidentPriority) => {
        switch (priority) {
            case 'high':
                return <Tag color="red">Nghiêm trọng</Tag>;
            case 'medium':
                return <Tag color="orange">Trung bình</Tag>;
            case 'low':
                return <Tag color="green">Thấp</Tag>;
            default:
                return null;
        }
    };

    const items = [
        {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined />,
            onClick: () => onEdit(incident)
        },
        ...(isOwner ? [{
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete(incident.id)
        }] : [])
    ];

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card size="small" className="shadow-sm hover:shadow-md transition-shadow border-gray-200" styles={{ body: { padding: '12px' } }}>
                <div className="flex justify-between items-start mb-2">
                    <Typography.Text strong className="truncate" style={{ maxWidth: '85%' }}>{incident.title}</Typography.Text>
                    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                        <Button type="text" size="small" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
                    </Dropdown>
                </div>

                <div className="text-gray-500 text-xs mb-2">
                    {incident.building?.name}
                    {incident.room ? ` - Phòng ${incident.room.name}` : ' (Khu vực chung)'}
                </div>

                <div className="flex justify-between items-center mt-3">
                    {getPriorityTag(incident.priority)}
                    {incident.image_urls && incident.image_urls.length > 0 && (
                        <Tag color="blue" className="mr-0">Có ảnh</Tag>
                    )}
                </div>

                <div className="text-gray-400 text-xs mt-2 text-right">
                    {dayjs(incident.created_at).format('DD/MM/YYYY')}
                </div>
            </Card>
        </div>
    );
};

interface KanbanColumnProps {
    id: IncidentStatus;
    title: string;
    incidents: Incident[];
    isOwner: boolean;
    onEdit: (incident: Incident) => void;
    onDelete: (id: string) => void;
    icon: React.ReactNode;
}

const KanbanColumn = ({ id, title, incidents, isOwner, onEdit, onDelete, icon }: KanbanColumnProps) => {
    return (
        <div className="flex flex-col bg-gray-50 rounded-lg p-3 w-full min-h-[500px]">
            <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
                <span className="mr-2 text-lg">{icon}</span>
                <Typography.Text strong className="text-gray-700">{title}</Typography.Text>
                <Tag className="ml-auto rounded-full mr-0 px-2 py-0 border-none bg-gray-200 text-gray-600">
                    {incidents.length}
                </Tag>
            </div>

            <SortableContext id={id} items={incidents.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto">
                    {incidents.map(incident => (
                        <KanbanCard
                            key={incident.id}
                            incident={incident}
                            isOwner={isOwner}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                    {incidents.length === 0 && (
                        <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded text-gray-400 text-sm">
                            Kéo thả vào đây
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

interface KanbanBoardProps {
    incidents: Incident[];
    isOwner: boolean;
    onEdit: (incident: Incident) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, newStatus: IncidentStatus) => Promise<void>;
}

export default function KanbanBoard({ incidents, isOwner, onEdit, onDelete, onStatusChange }: KanbanBoardProps) {
    const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

    const columns: { id: IncidentStatus; title: string; icon: React.ReactNode }[] = [
        { id: 'open', title: 'Mới báo cáo', icon: <span className="text-red-500">●</span> },
        { id: 'in_progress', title: 'Đang xử lý', icon: <SyncOutlined className="text-blue-500" spin={false} /> },
        { id: 'resolved', title: 'Đã giải quyết', icon: <CheckCircleOutlined className="text-green-500" /> },
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const incident = incidents.find(i => i.id === active.id);
        if (incident) {
            setActiveIncident(incident);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveIncident(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the columns
        const activeIncident = incidents.find(i => i.id === activeId);
        if (!activeIncident) return;

        let newStatus: IncidentStatus;

        // If dropped over a column
        if (['open', 'in_progress', 'resolved'].includes(overId as string)) {
            newStatus = overId as IncidentStatus;
        } else {
            // If dropped over another item
            const overIncident = incidents.find(i => i.id === overId);
            if (overIncident) {
                newStatus = overIncident.status;
            } else {
                return;
            }
        }

        // Check if status changed
        if (activeIncident.status !== newStatus) {
            // Check permissions for resolved status (only owner can change from resolved, except maybe in some cases)
            if (!isOwner && activeIncident.status === 'resolved') {
                return; // Normal users can't move out of resolved
            }
            // Trigger the status change
            await onStatusChange(activeId as string, newStatus);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {columns.map(col => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        icon={col.icon}
                        incidents={incidents.filter(i => i.status === col.id)}
                        isOwner={isOwner}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeIncident ? (
                    <KanbanCard
                        incident={activeIncident}
                        isOwner={isOwner}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
