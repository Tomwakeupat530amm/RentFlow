'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Drawer, Grid } from 'antd';
import {
    DashboardOutlined,
    HomeOutlined,
    FileTextOutlined,
    ThunderboltOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ProjectOutlined,
    TeamOutlined,
    DollarOutlined,
    LogoutOutlined,
    UserOutlined,
    QuestionCircleOutlined,
    ToolOutlined,
    CrownOutlined,
    ScheduleOutlined,
    ClearOutlined,
    WalletOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/app/(auth)/actions';
import NotificationBell from '@/components/layout/NotificationBell';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

interface MainLayoutProps {
    children: React.ReactNode;
    userId: string;
    userName: string;
    userRole: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, userId, userName, userRole }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const pathname = usePathname();
    const screens = useBreakpoint();
    const isMobile = !screens.md; // Treat xs and sm as mobile/tablet (drawer mode)

    // Close drawer when navigating on mobile
    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [pathname]);

    const menuItems = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: <Link href="/dashboard">Tổng quan</Link>,
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'property-group',
            label: 'Quản lý tài sản',
            type: 'group' as const,
            children: [
                {
                    key: '/buildings',
                    icon: <ProjectOutlined />,
                    label: <Link href="/buildings">Toà nhà</Link>,
                },
                {
                    key: '/rooms',
                    icon: <HomeOutlined />,
                    label: <Link href="/rooms">Phòng</Link>,
                },
            ],
        },
        {
            key: 'people-group',
            label: 'Khách & Hợp đồng',
            type: 'group' as const,
            children: [
                {
                    key: '/tenants',
                    icon: <TeamOutlined />,
                    label: <Link href="/tenants">Khách thuê</Link>,
                },
                {
                    key: '/contracts',
                    icon: <FileTextOutlined />,
                    label: <Link href="/contracts">Hợp đồng</Link>,
                },
            ],
        },
        {
            key: 'billing-group',
            label: 'Tài chính',
            type: 'group' as const,
            children: [
                {
                    key: '/meters',
                    icon: <ThunderboltOutlined />,
                    label: <Link href="/meters">Điện nước</Link>,
                },
                {
                    key: '/invoices',
                    icon: <DollarOutlined />,
                    label: <Link href="/invoices">Hoá đơn</Link>,
                },
                {
                    key: '/expenses',
                    icon: <WalletOutlined />,
                    label: <Link href="/expenses">Chi phí</Link>,
                },
            ],
        },
        {
            key: 'homestay-group',
            label: 'Homestay',
            type: 'group' as const,
            children: [
                {
                    key: '/homestay/bookings',
                    icon: <ScheduleOutlined />,
                    label: <Link href="/homestay/bookings">Lịch đặt phòng</Link>,
                },
                {
                    key: '/homestay/housekeeping',
                    icon: <ClearOutlined />,
                    label: <Link href="/homestay/housekeeping">Dọn dẹp</Link>,
                },
            ],
        },
        {
            key: 'ops-group',
            label: 'Vận hành',
            type: 'group' as const,
            children: [
                {
                    key: '/incidents',
                    icon: <ToolOutlined />,
                    label: <Link href="/incidents">Sự cố</Link>,
                },
                {
                    key: '/activity-logs',
                    icon: <HistoryOutlined />,
                    label: <Link href="/activity-logs">Nhật ký hoạt động</Link>,
                },
                {
                    key: '/settings',
                    icon: <SettingOutlined />,
                    label: <Link href="/settings">Cài đặt</Link>,
                },
                {
                    key: '/pricing',
                    icon: <CrownOutlined style={{ color: '#faad14' }} />,
                    label: <Link href="/pricing">Nâng cấp</Link>,
                },
            ],
        },
    ];

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
        },
        {
            key: 'help',
            icon: <QuestionCircleOutlined />,
            label: 'Trợ giúp',
        },
        { type: 'divider' as const },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: () => logout(),
        },
    ];

    // Common Logo Component
    const LogoArea = (
        <div
            style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start',
                padding: (collapsed && !isMobile) ? '0' : '0 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                gap: 12,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: 'white',
                    fontWeight: 800,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.4)',
                }}
            >
                <HomeOutlined />
            </div>
            {(!collapsed || isMobile) && (
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 16, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                        RentFlow
                    </div>
                </div>
            )}
        </div>
    );

    // Common Menu Component
    const NavigationMenu = (
        <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            style={{
                border: 'none',
                padding: '12px 0',
                background: 'transparent',
            }}
        />
    );

    return (
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
            {/* Desktop Sider */}
            {!isMobile && (
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    theme="dark"
                    width={260}
                    collapsedWidth={76}
                    style={{
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100,
                        boxShadow: '2px 0 8px rgba(0,21,41,0.05)',
                        background: '#001529',
                    }}
                >
                    {LogoArea}
                    {NavigationMenu}
                </Sider>
            )}

            {/* Mobile Drawer */}
            <Drawer
                title={null}
                placement="left"
                onClose={() => setMobileDrawerOpen(false)}
                open={mobileDrawerOpen}
                width={260}
                styles={{
                    body: { padding: 0, background: '#001529' },
                    header: { display: 'none' }
                }}
                closeIcon={null}
            >
                {LogoArea}
                {NavigationMenu}
            </Drawer>

            <Layout
                style={{
                    marginLeft: isMobile ? 0 : (collapsed ? 76 : 260),
                    transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* Top Header */}
                <Header
                    style={{
                        padding: isMobile ? '0 12px' : '0 24px',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'sticky',
                        top: 0,
                        zIndex: 90,
                        height: 64,
                        borderBottom: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                >
                    <Button
                        type="text"
                        icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
                        onClick={() => {
                            if (isMobile) {
                                setMobileDrawerOpen(true);
                            } else {
                                setCollapsed(!collapsed);
                            }
                        }}
                        style={{ fontSize: 18, width: 44, height: 44, color: '#475569' }}
                        className="hover:bg-slate-100"
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 12 }}>
                        {userId && <NotificationBell userId={userId} />}

                        <Dropdown
                            menu={{ items: userMenuItems }}
                            trigger={['click']}
                            placement="bottomRight"
                            overlayStyle={{ minWidth: 200 }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    cursor: 'pointer',
                                    padding: isMobile ? '4px' : '4px 12px 4px 6px',
                                    borderRadius: 32,
                                    transition: 'all 0.2s',
                                    border: isMobile ? 'none' : '1px solid #e2e8f0',
                                    background: isMobile ? 'transparent' : '#f8fafc',
                                }}
                                className="hover:bg-slate-100 hover:border-slate-300"
                            >
                                <Avatar
                                    size={isMobile ? 32 : 36}
                                    icon={<UserOutlined />}
                                    style={{
                                        background: 'linear-gradient(135deg, #0f172a, #334155)',
                                        color: 'white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    }}
                                />
                                {!isMobile && (
                                    <div style={{ lineHeight: 1.2, paddingRight: 4 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{userName}</div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                            {userRole === 'owner' ? 'Chủ quản lý' : 'Thành viên'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                {/* Page Content */}
                <Content
                    style={{
                        margin: isMobile ? '16px 12px' : '24px',
                        minHeight: 'calc(100vh - 64px - 48px)',
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
