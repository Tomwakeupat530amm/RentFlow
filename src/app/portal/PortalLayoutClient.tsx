'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeOutlined, FileTextOutlined, WarningOutlined, UserOutlined } from '@ant-design/icons';
import { theme } from 'antd';

export default function PortalLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { token } = theme.useToken();

    const isLoginPage = pathname === '/portal/login';

    const navItems = [
        { path: '/portal/dashboard', label: 'Tổng quan', icon: <HomeOutlined /> },
        { path: '/portal/invoices', label: 'Hoá đơn', icon: <FileTextOutlined /> },
        { path: '/portal/incidents', label: 'Sự cố', icon: <WarningOutlined /> },
        { path: '/portal/profile', label: 'Tài khoản', icon: <UserOutlined /> },
    ];

    if (isLoginPage) {
        return <div className="min-h-screen bg-gray-50">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16 flex flex-col">
            <main className="flex-1 w-full max-w-md mx-auto bg-white min-h-screen shadow-sm relative">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                <div className="max-w-md mx-auto flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                }`}
                                style={{ color: isActive ? token.colorPrimary : undefined }}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
