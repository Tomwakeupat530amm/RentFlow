'use client';

import React, { useState } from 'react';
import { Card, Typography, Button, Space, Divider, Alert, message } from 'antd';
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined, SafetyOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface SignatureData {
    signed_by_owner: boolean;
    signed_by_tenant: boolean;
    owner_signed_at: string | null;
    tenant_signed_at: string | null;
}

interface Props {
    contractId: string;
    signatureData: SignatureData;
    isOwner: boolean;
    isPremium: boolean;
    tenantName: string;
    onSign: (contractId: string, role: 'owner' | 'tenant') => Promise<{ error?: string }>;
}

export default function ESignaturePanel({
    contractId,
    signatureData,
    isOwner,
    isPremium,
    tenantName,
    onSign,
}: Props) {
    const [signing, setSigning] = useState(false);

    const handleSign = async (role: 'owner' | 'tenant') => {
        setSigning(true);
        try {
            const result = await onSign(contractId, role);
            if (result.error) {
                message.error(result.error);
            } else {
                message.success(`✅ ${role === 'owner' ? 'Chủ nhà' : 'Khách thuê'} đã ký hợp đồng`);
            }
        } finally {
            setSigning(false);
        }
    };

    if (!isPremium) {
        return (
            <Card style={{ borderRadius: 12, opacity: 0.7 }}>
                <Alert
                    type="info"
                    showIcon
                    icon={<SafetyOutlined />}
                    message="Ký hợp đồng điện tử"
                    description="Nâng cấp Premium để sử dụng tính năng ký hợp đồng điện tử."
                />
            </Card>
        );
    }

    const ownerSigned = signatureData.signed_by_owner;
    const tenantSigned = signatureData.signed_by_tenant;
    const fullyExecuted = ownerSigned && tenantSigned;

    return (
        <Card
            style={{
                borderRadius: 12,
                border: fullyExecuted ? '1px solid #b7eb8f' : '1px solid #ffe58f',
                background: fullyExecuted ? '#f6ffed' : '#fffbe6',
            }}
        >
            <Title level={5} style={{ marginBottom: 16 }}>
                <EditOutlined style={{ marginRight: 8 }} />
                Ký hợp đồng điện tử
            </Title>

            {fullyExecuted && (
                <Alert
                    type="success"
                    showIcon
                    message="Hợp đồng đã được ký bởi cả hai bên"
                    style={{ marginBottom: 16, borderRadius: 8 }}
                />
            )}

            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {/* Owner signature */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#fff',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                }}>
                    <div>
                        <Text strong>Chủ nhà</Text>
                        {ownerSigned ? (
                            <div style={{ marginTop: 4 }}>
                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Đã ký {signatureData.owner_signed_at
                                        ? new Date(signatureData.owner_signed_at).toLocaleDateString('vi-VN')
                                        : ''}
                                </Text>
                            </div>
                        ) : (
                            <div style={{ marginTop: 4 }}>
                                <CloseCircleOutlined style={{ color: '#faad14', marginRight: 4 }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>Chưa ký</Text>
                            </div>
                        )}
                    </div>
                    {!ownerSigned && isOwner && (
                        <Button
                            type="primary"
                            size="small"
                            loading={signing}
                            onClick={() => handleSign('owner')}
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Ký ngay
                        </Button>
                    )}
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Tenant signature */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#fff',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                }}>
                    <div>
                        <Text strong>Khách thuê: {tenantName}</Text>
                        {tenantSigned ? (
                            <div style={{ marginTop: 4 }}>
                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Đã ký {signatureData.tenant_signed_at
                                        ? new Date(signatureData.tenant_signed_at).toLocaleDateString('vi-VN')
                                        : ''}
                                </Text>
                            </div>
                        ) : (
                            <div style={{ marginTop: 4 }}>
                                <CloseCircleOutlined style={{ color: '#faad14', marginRight: 4 }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>Chưa ký</Text>
                            </div>
                        )}
                    </div>
                    {!tenantSigned && isOwner && (
                        <Button
                            size="small"
                            loading={signing}
                            onClick={() => handleSign('tenant')}
                        >
                            Ký thay khách
                        </Button>
                    )}
                </div>
            </Space>
        </Card>
    );
}
