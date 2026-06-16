'use client';

import React from 'react';
import { Modal, Typography } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

const { Text } = Typography;

interface ConfirmModalProps {
    /** Is the modal visible */
    open: boolean;
    /** Modal title */
    title?: string;
    /** Description text explaining what happens on confirm */
    description?: string;
    /** Text for the confirm button */
    confirmText?: string;
    /** Text for the cancel button */
    cancelText?: string;
    /** Is the confirm action destructive (red button) */
    danger?: boolean;
    /** Loading state for the confirm button */
    loading?: boolean;
    /** Callback when user confirms */
    onConfirm: () => void;
    /** Callback when user cancels or closes */
    onCancel: () => void;
}

/**
 * Reusable confirmation modal for destructive or important actions.
 * Shows a warning icon with customizable title, description, and button text.
 */
export default function ConfirmModal({
    open,
    title = 'Xác nhận thao tác',
    description = 'Bạn có chắc chắn muốn thực hiện thao tác này? Hành động không thể hoàn tác.',
    confirmText = 'Xác nhận',
    cancelText = 'Huỷ bỏ',
    danger = true,
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <Modal
            open={open}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ExclamationCircleFilled
                        style={{
                            color: danger ? '#ef4444' : '#f59e0b',
                            fontSize: 22,
                        }}
                    />
                    <span style={{ fontWeight: 700 }}>{title}</span>
                </div>
            }
            okText={confirmText}
            cancelText={cancelText}
            onOk={onConfirm}
            onCancel={onCancel}
            okButtonProps={{
                danger,
                loading,
            }}
            centered
            width={420}
        >
            <div style={{ paddingLeft: 32, paddingTop: 4 }}>
                <Text type="secondary">{description}</Text>
            </div>
        </Modal>
    );
}
