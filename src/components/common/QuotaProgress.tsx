'use client';

import React from 'react';
import { Progress, Tag, Button, Space } from 'antd';
import { CrownOutlined, ArrowUpOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface Props {
    current: number;
    limit: number;
    entityName: 'phòng' | 'tòa nhà';
    planType?: 'free' | 'premium';
}

export default function QuotaProgress({ current, limit, entityName, planType = 'free' }: Props) {
    if (planType === 'premium') {
        return (
            <div className="flex items-center space-x-2 py-1">
                <Tag color="gold" icon={<CrownOutlined />} className="px-3 py-1 font-semibold text-xs">
                    Gói Premium: Quản lý không giới hạn {entityName}
                </Tag>
            </div>
        );
    }

    const percent = Math.min(100, Math.round((current / limit) * 100));
    const isAtLimit = current >= limit;
    const isNearLimit = percent >= 80;

    let strokeColor = '#0d9488'; // Teal
    if (isAtLimit) strokeColor = '#ef4444'; // Red
    else if (isNearLimit) strokeColor = '#fa8c16'; // Orange

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <Space size={6}>
                        <InfoCircleOutlined style={{ color: strokeColor }} />
                        <span className="text-xs font-semibold text-slate-700">
                            Hạn mức sử dụng (Gói Free):
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                            {current} / {limit} {entityName}
                        </span>
                    </Space>
                    <span className="text-xs font-bold font-mono" style={{ color: strokeColor }}>
                        {percent}%
                    </span>
                </div>
                <Progress
                    percent={percent}
                    showInfo={false}
                    strokeColor={strokeColor}
                    size="small"
                    className="!mb-0"
                />
            </div>

            {isNearLimit && (
                <Link href="/pricing">
                    <Button
                        size="small"
                        type={isAtLimit ? 'primary' : 'default'}
                        danger={isAtLimit}
                        icon={<ArrowUpOutlined />}
                        className="text-xs font-medium w-full md:w-auto"
                    >
                        Nâng cấp Premium
                    </Button>
                </Link>
            )}
        </div>
    );
}
