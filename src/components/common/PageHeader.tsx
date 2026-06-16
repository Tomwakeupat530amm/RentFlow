'use client';

import React from 'react';
import { Breadcrumb, Typography } from 'antd';
import { usePathname } from 'next/navigation';
import Link from 'next/link';


// Vietnamese labels for each route segment
const ROUTE_LABELS: Record<string, string> = {
    dashboard: 'Tổng quan',
    buildings: 'Toà nhà',
    rooms: 'Phòng',
    tenants: 'Khách thuê',
    contracts: 'Hợp đồng',
    meters: 'Điện nước',
    invoices: 'Hoá đơn',
    incidents: 'Sự cố',
    settings: 'Cài đặt',
};

interface PageHeaderProps {
    /** Page title — overrides auto-detected title from route */
    title?: string;
    /** Subtitle or description under the title */
    subtitle?: string;
    /** Action buttons on the right side */
    extra?: React.ReactNode;
    /** Show auto-generated breadcrumb */
    showBreadcrumb?: boolean;
}

/**
 * Page header component with auto-generated breadcrumb navigation,
 * title, optional subtitle, and action area. Provides consistent
 * page structure across all admin pages.
 */
export default function PageHeader({
    title: titleProp,
    subtitle,
    extra,
    showBreadcrumb = true,
}: PageHeaderProps) {
    const pathname = usePathname();

    // Generate breadcrumb items from current path
    const pathSegments = pathname
        .split('/')
        .filter(Boolean);

    const breadcrumbItems = [
        {
            title: <Link href="/dashboard">Trang chủ</Link>,
        },
        ...pathSegments.map((segment, index) => {
            const path = '/' + pathSegments.slice(0, index + 1).join('/');
            const label = ROUTE_LABELS[segment] || segment;
            const isLast = index === pathSegments.length - 1;

            return {
                title: isLast ? label : <Link href={path}>{label}</Link>,
            };
        }),
    ];

    // Auto-detect title from last path segment
    const lastSegment = pathSegments[pathSegments.length - 1];
    const displayTitle = titleProp || ROUTE_LABELS[lastSegment] || lastSegment;

    return (
        <div style={{ marginBottom: 24 }}>
            {showBreadcrumb && (
                <Breadcrumb
                    items={breadcrumbItems}
                    style={{ marginBottom: 12, fontSize: 13 }}
                />
            )}

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 16,
                }}
            >
                <div>
                    <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                        {displayTitle}
                    </Typography.Title>
                    {subtitle && (
                        <Typography.Text type="secondary" style={{ fontSize: 14, marginTop: 2, display: 'block' }}>
                            {subtitle}
                        </Typography.Text>
                    )}
                </div>

                {extra && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {extra}
                    </div>
                )}
            </div>
        </div>
    );
}
