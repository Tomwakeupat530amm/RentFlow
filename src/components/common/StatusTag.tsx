import React from 'react';
import { Tag } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    MinusCircleOutlined,
    SyncOutlined,
    ToolOutlined,
    StopOutlined,
} from '@ant-design/icons';

// Pre-defined status configurations for common use cases in the app
const STATUS_PRESETS: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    // Invoice statuses
    paid: { color: 'success', icon: <CheckCircleOutlined />, label: 'Đã thanh toán' },
    pending: { color: 'processing', icon: <ClockCircleOutlined />, label: 'Chờ thanh toán' },
    overdue: { color: 'error', icon: <ExclamationCircleOutlined />, label: 'Quá hạn' },
    partial: { color: 'warning', icon: <SyncOutlined />, label: 'Thanh toán 1 phần' },

    // Room statuses
    occupied: { color: 'success', icon: <CheckCircleOutlined />, label: 'Đang thuê' },
    vacant: { color: 'default', icon: <MinusCircleOutlined />, label: 'Trống' },
    maintenance: { color: 'warning', icon: <ToolOutlined />, label: 'Đang sửa chữa' },

    // Contract statuses
    active: { color: 'success', icon: <CheckCircleOutlined />, label: 'Đang hiệu lực' },
    expired: { color: 'error', icon: <StopOutlined />, label: 'Đã hết hạn' },
    expiring_soon: { color: 'warning', icon: <ExclamationCircleOutlined />, label: 'Sắp hết hạn' },

    // Incident statuses
    open: { color: 'error', icon: <ExclamationCircleOutlined />, label: 'Mở' },
    in_progress: { color: 'processing', icon: <SyncOutlined spin />, label: 'Đang xử lý' },
    resolved: { color: 'success', icon: <CheckCircleOutlined />, label: 'Đã xử lý' },
};

interface StatusTagProps {
    /** Status key — matches a preset or use custom values */
    status: string;
    /** Override the displayed label */
    label?: string;
    /** Override the tag color */
    color?: string;
    /** Show icon alongside label */
    showIcon?: boolean;
}

/**
 * Reusable status tag component that maps common app statuses
 * to colored tags with icons. Supports all invoice, room, contract,
 * and incident statuses out-of-the-box.
 */
export default function StatusTag({ status, label, color, showIcon = true }: StatusTagProps) {
    const preset = STATUS_PRESETS[status];

    const displayColor = color || preset?.color || 'default';
    const displayLabel = label || preset?.label || status;
    const displayIcon = showIcon ? preset?.icon : undefined;

    return (
        <Tag color={displayColor} icon={displayIcon}>
            {displayLabel}
        </Tag>
    );
}
