'use client';

import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseFormModal from '@/components/expenses/ExpenseFormModal';

export default function ExpensesPage() {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    // Key to force re-render/refetch of ExpenseList after generation
    const [listKey, setListKey] = useState(0);

    return (
        <>
            <PageHeader
                title="Quản lý Chi phí"
                subtitle="Theo dõi và quản lý các khoản chi tiêu vận hành toà nhà."
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-red-600 hover:bg-red-500"
                    >
                        Thêm Khoản Chi
                    </Button>
                }
            />

            <div className="mt-6">
                <ExpenseList key={listKey} />
            </div>

            <ExpenseFormModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => setListKey(prev => prev + 1)}
            />
        </>
    );
}
