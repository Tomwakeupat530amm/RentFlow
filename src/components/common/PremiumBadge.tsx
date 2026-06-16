'use client';

import React from 'react';
import { Tag, Tooltip } from 'antd';
import { LockOutlined, CrownOutlined } from '@ant-design/icons';
import PremiumUpgradeModal from './PremiumUpgradeModal';
import { useState } from 'react';

interface PremiumBadgeProps {
    showUpgradeLink?: boolean;
    size?: 'small' | 'default';
}

export default function PremiumBadge({ showUpgradeLink = true, size = 'default' }: PremiumBadgeProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Tooltip title={showUpgradeLink ? 'Nâng cấp lên Premium để mở khóa' : 'Tính năng Premium'}>
                <Tag
                    icon={<CrownOutlined />}
                    color="gold"
                    style={{
                        cursor: showUpgradeLink ? 'pointer' : 'default',
                        fontSize: size === 'small' ? 11 : 13,
                        padding: size === 'small' ? '0 6px' : '2px 10px',
                    }}
                    onClick={showUpgradeLink ? () => setIsModalOpen(true) : undefined}
                >
                    Premium
                </Tag>
            </Tooltip>
            {showUpgradeLink && (
                <PremiumUpgradeModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}

interface PremiumGateProps {
    isPremium: boolean;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function PremiumGate({ isPremium, children, fallback }: PremiumGateProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (isPremium) return <>{children}</>;

    return (
        <>{fallback || (
            <>
                <div
                    style={{
                        position: 'relative',
                        opacity: 0.5,
                        cursor: 'pointer',
                        filter: 'blur(2px)',
                        transition: 'all 0.3s ease',
                    }}
                    onClickCapture={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsModalOpen(true);
                    }}
                >
                    <div style={{ pointerEvents: 'none' }}>
                        {children}
                    </div>
                </div>

                <PremiumUpgradeModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    description="Tính năng này yêu cầu nâng cấp gói Premium để sử dụng. Xem bảng giá để không bỏ lỡ."
                />
            </>
        )}</>
    );
}

interface UpgradeBannerProps {
    current: number;
    limit: number;
    entityName: string;
}

export function UpgradeBanner({ current, limit, entityName }: UpgradeBannerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const percentage = Math.round((current / limit) * 100);
    const isNearLimit = percentage >= 80;
    const isAtLimit = current >= limit;

    if (!isNearLimit) return null;

    return (
        <>
            <div
                style={{
                    padding: '12px 20px',
                    borderRadius: 8,
                    marginBottom: 16,
                    background: isAtLimit
                        ? 'linear-gradient(135deg, #fff2e8, #ffe7ba)'
                        : 'linear-gradient(135deg, #e6f7ff, #bae7ff)',
                    border: `1px solid ${isAtLimit ? '#ffd591' : '#91d5ff'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isAtLimit ? <LockOutlined style={{ color: '#fa8c16', fontSize: 18 }} /> : null}
                    <span>
                        {isAtLimit
                            ? `Bạn đã đạt giới hạn ${limit} ${entityName} (gói Free). Nâng cấp để mở khóa không giới hạn!`
                            : `Bạn đang sử dụng ${current}/${limit} ${entityName} (gói Free).`
                        }
                    </span>
                </div>
                <Tag
                    icon={<CrownOutlined />}
                    color="gold"
                    style={{ cursor: 'pointer', fontSize: 13, padding: '2px 12px' }}
                    onClick={() => setIsModalOpen(true)}
                >
                    Nâng cấp
                </Tag>
            </div>

            <PremiumUpgradeModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                featureName={`Không giới hạn ${entityName}`}
                description={`Gói Free của bạn bị giới hạn tối đa ${limit} ${entityName}. Nâng cấp lên Premium để quản lý không giới hạn, kèm theo trí tuệ nhân tạo và hợp đồng điện tử.`}
            />
        </>
    );
}
