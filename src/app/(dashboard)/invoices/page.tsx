'use client';

import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import InvoiceList from '@/components/invoices/InvoiceList';
import dynamic from 'next/dynamic';
import { Skeleton } from 'antd';

const GenerateInvoiceModal = dynamic(() => import('@/components/invoices/GenerateInvoiceModal'), {
    ssr: false,
    loading: () => <Skeleton active />
});

export default function InvoicesPage() {
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    // Key to force re-render/refetch of InvoiceList after generation
    const [listKey, setListKey] = useState(0);

    return (
        <>
            <PageHeader
                title="Hoá đơn"
                subtitle="Tạo, quản lý và theo dõi thanh toán hoá đơn hàng tháng."
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setGenerateModalOpen(true)}
                        className="bg-teal-600 hover:bg-teal-500"
                    >
                        Tạo Hoá Đơn Hàng Loạt
                    </Button>
                }
            />

            <div className="mt-6">
                <InvoiceList key={listKey} />
            </div>

            <GenerateInvoiceModal
                open={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onSuccess={() => setListKey(prev => prev + 1)}
            />
        </>
    );
}

