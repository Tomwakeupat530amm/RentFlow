import React from 'react';
import { Card, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface StatCardProps {
    /** Card title / label */
    title: string;
    /** Main numeric value */
    value: string | number;
    /** Optional suffix (e.g., "tr đ", "phòng") */
    suffix?: string;
    /** Icon element displayed in a colored badge */
    icon: React.ReactNode;
    /** Gradient background for the icon badge */
    iconBg?: string;
    /** Shadow color for the icon badge */
    iconShadow?: string;
    /** Optional trend text (e.g., "+12%") */
    trend?: string;
    /** Trend direction — determines arrow and color */
    trendDirection?: 'up' | 'down';
}

/**
 * Statistic card component for dashboards and summary sections.
 * Displays a metric with an icon badge, optional trend indicator,
 * and customizable gradient styling.
 */
export default function StatCard({
    title,
    value,
    suffix,
    icon,
    iconBg = 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    iconShadow = 'rgba(13, 148, 136, 0.25)',
    trend,
    trendDirection = 'up',
}: StatCardProps) {
    return (
        <Card
            variant="borderless"
            style={{ borderRadius: 12, overflow: 'hidden' }}
            styles={{ body: { padding: '20px 24px' } }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                        {title}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                            {value}
                        </span>
                        {suffix && (
                            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                                {suffix}
                            </span>
                        )}
                    </div>
                    {trend && (
                        <div style={{ marginTop: 8 }}>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: trendDirection === 'up' ? '#22c55e' : '#ef4444',
                                    background: trendDirection === 'up' ? '#f0fdf4' : '#fef2f2',
                                    padding: '2px 8px',
                                    borderRadius: 20,
                                }}
                            >
                                {trendDirection === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                {trend}
                            </span>
                        </div>
                    )}
                </div>
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: `0 4px 12px ${iconShadow}`,
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
            </div>
        </Card>
    );
}
