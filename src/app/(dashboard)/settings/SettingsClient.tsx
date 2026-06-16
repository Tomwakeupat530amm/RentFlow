'use client';

import React, { useState } from 'react';
import {
    Card, Form, Input, Button, Typography, Tag, Table, message, Divider, Space, Tooltip, Row, Col,
} from 'antd';
import {
    UserOutlined, PhoneOutlined, CopyOutlined, ReloadOutlined,
    TeamOutlined, CrownOutlined,
} from '@ant-design/icons';
import { updateProfile, updateOrganization, regenerateInviteCode } from './actions';


interface Props {
    profile: {
        id: string;
        full_name: string | null;
        phone: string | null;
        role: 'owner' | 'member';
        org_id: string | null;
        organizations: {
            id: string;
            name: string;
            invite_code: string;
            plan_type?: string;
        } | null;
    } | null;
    email: string;
    members: {
        id: string;
        full_name: string | null;
        role: string;
        created_at: string;
    }[];
}

export default function SettingsClient({ profile, email, members }: Props) {
    const [profileForm] = Form.useForm();
    const [orgForm] = Form.useForm();
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingOrg, setSavingOrg] = useState(false);
    const [inviteCode, setInviteCode] = useState(profile?.organizations?.invite_code || '');

    const isOwner = profile?.role === 'owner';
    const planType = profile?.organizations?.plan_type || 'free';

    const handleSaveProfile = async () => {
        const values = await profileForm.validateFields();
        setSavingProfile(true);
        const formData = new FormData();
        formData.append('fullName', values.fullName);
        formData.append('phone', values.phone || '');
        const result = await updateProfile(formData);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Đã cập nhật thông tin');
        }
        setSavingProfile(false);
    };

    const handleSaveOrg = async () => {
        const values = await orgForm.validateFields();
        setSavingOrg(true);
        const formData = new FormData();
        formData.append('orgName', values.orgName);
        const result = await updateOrganization(formData);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Đã cập nhật tổ chức');
        }
        setSavingOrg(false);
    };

    const handleRegenerateCode = async () => {
        const result = await regenerateInviteCode();
        if (result.error) {
            message.error(result.error);
        } else {
            setInviteCode(result.newCode || '');
            message.success('Đã tạo mã mời mới');
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        message.success('Đã sao chép mã mời');
    };

    const memberColumns = [
        {
            title: 'Thành viên',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (name: string | null, record: { id: string; role: string }) => (
                <Space>
                    <Typography.Text strong>{name || 'Chưa đặt tên'}</Typography.Text>
                    {record.role === 'owner' && <Tag color="gold" icon={<CrownOutlined />}>Owner</Tag>}
                    {record.id === profile?.id && <Tag>Bạn</Tag>}
                </Space>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            render: (role: string) => role === 'owner' ? 'Chủ sở hữu' : 'Thành viên',
        },
        {
            title: 'Tham gia',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 140,
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
        },
    ];

    return (
        <Row gutter={[24, 24]}>
            {/* Left — Personal Info */}
            <Col xs={24} lg={12}>
                <Card style={{ borderRadius: 12 }} title={<span style={{ fontWeight: 700 }}>👤 Thông tin cá nhân</span>}>
                    <Form
                        form={profileForm}
                        layout="vertical"
                        requiredMark={false}
                        initialValues={{
                            fullName: profile?.full_name || '',
                            phone: profile?.phone || '',
                        }}
                    >
                        <Form.Item label={<span style={{ fontWeight: 500 }}>Email</span>}>
                            <Input value={email} disabled prefix={<UserOutlined />} />
                        </Form.Item>

                        <Form.Item
                            name="fullName"
                            label={<span style={{ fontWeight: 500 }}>Họ và tên</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label={<span style={{ fontWeight: 500 }}>Số điện thoại</span>}
                        >
                            <Input prefix={<PhoneOutlined />} placeholder="0912345678" />
                        </Form.Item>

                        <Button type="primary" loading={savingProfile} onClick={handleSaveProfile}>
                            Lưu thông tin
                        </Button>
                    </Form>
                </Card>
            </Col>

            {/* Right — Organization Info */}
            <Col xs={24} lg={12}>
                <Card style={{ borderRadius: 12, marginBottom: 24 }} title={<span style={{ fontWeight: 700 }}>🏢 Tổ chức</span>}>
                    {profile?.organizations ? (
                        <>
                            <Form
                                form={orgForm}
                                layout="vertical"
                                requiredMark={false}
                                initialValues={{ orgName: profile.organizations.name }}
                            >
                                <Form.Item
                                    name="orgName"
                                    label={<span style={{ fontWeight: 500 }}>Tên tổ chức</span>}
                                    rules={[{ required: true }]}
                                >
                                    <Input prefix={<TeamOutlined />} disabled={!isOwner} />
                                </Form.Item>

                                {isOwner && (
                                    <Button type="primary" loading={savingOrg} onClick={handleSaveOrg}>
                                        Cập nhật tổ chức
                                    </Button>
                                )}
                            </Form>

                            <Divider />

                            {/* Invite Code */}
                            <div>
                                <Typography.Text style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Mã mời</Typography.Text>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 16px',
                                    background: '#f8fafc',
                                    borderRadius: 8,
                                    border: '1px dashed #e2e8f0',
                                }}>
                                    <Typography.Text
                                        style={{
                                            fontFamily: 'monospace',
                                            fontSize: 18,
                                            fontWeight: 700,
                                            letterSpacing: 3,
                                            color: '#0d9488',
                                            flex: 1,
                                        }}
                                    >
                                        {inviteCode}
                                    </Typography.Text>
                                    <Tooltip title="Sao chép">
                                        <Button type="text" icon={<CopyOutlined />} onClick={handleCopyCode} />
                                    </Tooltip>
                                    {isOwner && (
                                        <Tooltip title="Tạo mã mới">
                                            <Button type="text" icon={<ReloadOutlined />} onClick={handleRegenerateCode} />
                                        </Tooltip>
                                    )}
                                </div>
                                <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
                                    Gửi mã này cho nhân viên/kế toán để họ tham gia tổ chức khi đăng ký.
                                </Typography.Text>
                            </div>
                        </>
                    ) : (
                        <Typography.Text type="secondary">Bạn chưa thuộc tổ chức nào.</Typography.Text>
                    )}
                </Card>

                {/* Subscription Info */}
                <Card
                    style={{
                        borderRadius: 12,
                        marginBottom: 24,
                        border: planType === 'premium' ? '1px solid #ffd666' : undefined,
                        background: planType === 'premium' ? 'linear-gradient(135deg, #fffbe6, #fff)' : undefined,
                    }}
                    title={
                        <span style={{ fontWeight: 700 }}>
                            {planType === 'premium' ? '👑' : '📦'} Gói dịch vụ
                        </span>
                    }
                    extra={
                        planType === 'premium'
                            ? <Tag icon={<CrownOutlined />} color="gold">Premium</Tag>
                            : <Tag color="default">Free</Tag>
                    }
                >
                    {planType === 'premium' ? (
                        <div>
                            <Typography.Text>Bạn đang sử dụng gói <Typography.Text strong style={{ color: '#faad14' }}>Premium</Typography.Text>.</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                Không giới hạn tòa nhà, phòng và toàn bộ tính năng nâng cao.
                            </Typography.Text>
                        </div>
                    ) : (
                        <div>
                            <Typography.Text>Bạn đang sử dụng gói <Typography.Text strong>Free</Typography.Text> (tối đa 2 tòa / 30 phòng).</Typography.Text>
                            <br />
                            <Button
                                type="link"
                                icon={<CrownOutlined style={{ color: '#faad14' }} />}
                                href="/pricing"
                                style={{ padding: 0, marginTop: 8 }}
                            >
                                Nâng cấp lên Premium
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Members Table */}
                <Card style={{ borderRadius: 12 }} title={<span style={{ fontWeight: 700 }}>👥 Thành viên ({members.length})</span>}>
                    <Table
                        columns={memberColumns}
                        dataSource={members}
                        rowKey="id"
                        pagination={false}
                        size="small"
                    />
                </Card>
            </Col>
        </Row>
    );
}
