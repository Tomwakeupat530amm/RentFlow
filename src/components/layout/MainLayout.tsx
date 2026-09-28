'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Drawer, Grid, Badge } from 'antd';
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
    WalletOutlined,
    ScheduleOutlined,
    ClearOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/app/(auth)/actions';
import NotificationBell from '@/components/layout/NotificationBell';
import SidebarSubscriptionCard from '@/components/layout/SidebarSubscriptionCard';
import type { PlanType } from '@/types/database';
import type { PendingActionCounts } from '@/lib/dashboard/pending-actions';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

interface MainLayoutProps {
    children: React.ReactNode;
    userId: string;
    userName: string;
    userRole: string;
    planType?: PlanType;
    roomCount?: number;
    pendingCounts?: PendingActionCounts;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
    children, 
    userId, 
    userName, 
    userRole,
    planType,
    roomCount,
    pendingCounts,
}) => {
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
            label: <Link href="/dashboard" prefetch={true}>Tổng quan</Link>,
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
                    label: <Link href="/buildings" prefetch={true}>Toà nhà</Link>,
                },
                {
                    key: '/rooms',
                    icon: <HomeOutlined />,
                    label: <Link href="/rooms" prefetch={true}>Phòng</Link>,
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
                    label: <Link href="/tenants" prefetch={true}>Khách thuê</Link>,
                },
                {
                    key: '/contracts',
                    icon: <FileTextOutlined />,
                    label: (
                        <Link href="/contracts" prefetch={true} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span>Hợp đồng</span>
                            {Boolean(pendingCounts && pendingCounts.expiringContracts > 0) && (
                                <Badge
                                    count={pendingCounts?.expiringContracts}
                                    style={{ backgroundColor: '#eab308', boxShadow: 'none' }}
                                    title={`${pendingCounts?.expiringContracts} hợp đồng sắp hết hạn`}
                                />
                            )}
                        </Link>
                    ),
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
                    label: <Link href="/homestay/bookings" prefetch={true}>Lịch đặt phòng</Link>,
                },
                {
                    key: '/homestay/housekeeping',
                    icon: <ClearOutlined />,
                    label: <Link href="/homestay/housekeeping" prefetch={true}>Dọn dẹp</Link>,
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
                    label: <Link href="/meters" prefetch={true}>Điện nước</Link>,
                },
                {
                    key: '/invoices',
                    icon: <DollarOutlined />,
                    label: (
                        <Link href="/invoices" prefetch={true} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span>Hoá đơn</span>
                            {Boolean(pendingCounts && pendingCounts.unpaidInvoices > 0) && (
                                <Badge
                                    count={pendingCounts?.unpaidInvoices}
                                    style={{ backgroundColor: '#f97316', boxShadow: 'none' }}
                                    title={`${pendingCounts?.unpaidInvoices} hoá đơn chưa thanh toán / quá hạn`}
                                />
                            )}
                        </Link>
                    ),
                },
                {
                    key: '/expenses',
                    icon: <WalletOutlined />,
                    label: <Link href="/expenses" prefetch={true}>Chi phí</Link>,
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
                    label: (
                        <Link href="/incidents" prefetch={true} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span>Sự cố</span>
                            {Boolean(pendingCounts && pendingCounts.incidents > 0) && (
                                <Badge
                                    count={pendingCounts?.incidents}
                                    style={{ backgroundColor: '#ef4444', boxShadow: 'none' }}
                                    title={`${pendingCounts?.incidents} sự cố đang chờ xử lý`}
                                />
                            )}
                        </Link>
                    ),
                },
                {
                    key: '/settings',
                    icon: <SettingOutlined />,
                    label: <Link href="/settings" prefetch={true}>Cài đặt</Link>,
                },
            ],
        },
    ];

    const quickCreateItems = [
        {
            key: 'contract',
            icon: <FileTextOutlined style={{ color: '#0d9488', fontSize: 16 }} />,
            label: (
                <Link href="/contracts" style={{ display: 'block', padding: '2px 0' }}>
                    <div style={{ fontWeight: 600 }}>Tạo hợp đồng mới</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Lập hợp đồng cho khách thuê mới</div>
                </Link>
            ),
        },
        {
            key: 'meter',
            icon: <ThunderboltOutlined style={{ color: '#eab308', fontSize: 16 }} />,
            label: (
                <Link href="/meters" style={{ display: 'block', padding: '2px 0' }}>
                    <div style={{ fontWeight: 600 }}>Ghi điện nước tháng này</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Nhập chỉ số điện, nước các phòng</div>
                </Link>
            ),
        },
        {
            key: 'invoice',
            icon: <DollarOutlined style={{ color: '#16a34a', fontSize: 16 }} />,
            label: (
                <Link href="/invoices" style={{ display: 'block', padding: '2px 0' }}>
                    <div style={{ fontWeight: 600 }}>Lập hoá đơn hàng loạt</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Tính tiền phòng & dịch vụ hàng tháng</div>
                </Link>
            ),
        },
        { type: 'divider' as const },
        {
            key: 'expense',
            icon: <WalletOutlined style={{ color: '#ef4444', fontSize: 16 }} />,
            label: (
                <Link href="/expenses" style={{ display: 'block', padding: '2px 0' }}>
                    <div style={{ fontWeight: 600 }}>Thêm khoản chi phí</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Ghi nhận chi phí vận hành, sửa chữa</div>
                </Link>
            ),
        },
        {
            key: 'incident',
            icon: <ToolOutlined style={{ color: '#f97316', fontSize: 16 }} />,
            label: (
                <Link href="/incidents" style={{ display: 'block', padding: '2px 0' }}>
                    <div style={{ fontWeight: 600 }}>Ghi nhận sự cố</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Tiếp nhận báo hỏng hóc từ khách</div>
                </Link>
            ),
        },
        {
            key: 'tenant',
            icon: <TeamOutlined style={{ color: '#3b82f6', fontSize: 16 }} />,
            label: (
                <Link href="/tenants" style={{ display: 'block', padding: '2px 0' }}>
                    <div style={{ fontWeight: 600 }}>Thêm khách thuê</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Hồ sơ khách, CCCD, thông tin liên lạc</div>
                </Link>
            ),
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
                        display: 'flex',
                        flexDirection: 'column',
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
                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                        {NavigationMenu}
                    </div>
                    <SidebarSubscriptionCard
                        collapsed={collapsed}
                        planType={planType}
                        roomCount={roomCount}
                    />
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
                    body: { 
                        padding: 0, 
                        background: '#001529',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                    },
                    header: { display: 'none' }
                }}
                closeIcon={null}
            >
                {LogoArea}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {NavigationMenu}
                </div>
                <SidebarSubscriptionCard
                    collapsed={false}
                    planType={planType}
                    roomCount={roomCount}
                />
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                        {/* Quick Create Action Dropdown */}
                        <Dropdown
                            menu={{ items: quickCreateItems }}
                            trigger={['click']}
                            placement="bottomRight"
                            overlayStyle={{ minWidth: 260 }}
                        >
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                style={{
                                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    height: isMobile ? 36 : 38,
                                    padding: isMobile ? '0 10px' : '0 14px',
                                    boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                {!isMobile && 'Tạo nhanh'}
                            </Button>
                        </Dropdown>

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
