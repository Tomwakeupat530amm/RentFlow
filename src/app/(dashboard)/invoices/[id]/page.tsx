import { getInvoiceById } from '@/app/(dashboard)/invoices/actions';
import PageHeader from '@/components/common/PageHeader';
import { Card, Descriptions, Tag, Table, Typography, Button, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from 'dayjs';
import InvoiceExport from '@/components/invoices/InvoiceExport';
import type { Invoice, InvoiceItem } from '@/types/database';
import PaymentSection from '@/components/invoices/PaymentSection';
import PrintInvoiceButton from '@/components/invoices/PrintInvoiceButton';


export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Note: Next.js 15 params properties need to be awaited
    const resolvedParams = await params;
    const { data: invoice, error } = await getInvoiceById(resolvedParams.id);

    if (error || !invoice) {
        return (
            <div className="p-8">
                <Alert type="error" message="Không tìm thấy hoá đơn" description={error || 'Hoá đơn không tồn tại hoặc đã bị xoá.'} />
                <div className="mt-4">
                    <Link href="/invoices">
                        <Button icon={<ArrowLeftOutlined />}>Quay lại danh sách</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { items, room, building, tenant, paymentSettings } = invoice as any;

    const hasPayosConfig = !!(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);

    // Table columns for invoice items
    const columns = [
        {
            title: 'Hạng mục',
            dataIndex: 'description',
            key: 'description',
            render: (text: string, record: InvoiceItem) => (
                <div>
                    <div className="font-semibold text-gray-800">{text}</div>
                    <div className="text-xs text-gray-500 uppercase">{record.type}</div>
                </div>
            )
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center' as const,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'unit_price',
            key: 'unit_price',
            render: (val: number) => `${val.toLocaleString()} đ`,
            align: 'right' as const,
        },
        {
            title: 'Thành tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number) => <Typography.Text strong>{val.toLocaleString()} đ</Typography.Text>,
            align: 'right' as const,
        },
    ];

    let statusColor = 'gold';
    let statusLabel = 'Chưa thanh toán';
    if (invoice.status === 'paid') {
        statusColor = 'green'; statusLabel = 'Đã thanh toán';
    } else if (invoice.status === 'partial') {
        statusColor = 'orange'; statusLabel = 'Thanh toán một phần';
    } else if (invoice.status === 'unpaid') {
        statusColor = 'red'; statusLabel = 'Chưa thanh toán';
    }

    const remaining = Number(invoice.total_amount) - Number(invoice.paid_amount);

    return (
        <>
            <PageHeader
                title={`Chi tiết hoá đơn`}
                subtitle={`Phòng ${room?.name || '...'} - Tháng ${invoice.month}`}
                extra={
                    <div className="flex gap-2 no-print">
                        <PrintInvoiceButton />
                        <InvoiceExport
                            invoice={invoice as unknown as Invoice}
                            items={items as unknown as InvoiceItem[]}
                            tenantName={tenant?.full_name}
                            roomName={room?.name}
                            buildingName={building?.name}
                        />
                    </div>
                }
            />

            <div className="max-w-4xl mx-auto mt-6 space-y-6">
                <Card className="shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <Typography.Title level={4} className="!mt-0 !mb-1">{invoice.title}</Typography.Title>
                            <Typography.Text type="secondary">Mã HĐ: <span className="font-mono">{invoice.id.split('-')[0]}</span></Typography.Text>
                        </div>
                        <div>
                            <Tag color={statusColor} className="px-3 py-1 text-sm m-0 border-0">{statusLabel}</Tag>
                        </div>
                    </div>

                    <Descriptions bordered column={{ md: 2, sm: 1, xs: 1 }} className="mb-8">
                        <Descriptions.Item label="Toà nhà">{building?.name}</Descriptions.Item>
                        <Descriptions.Item label="Phòng"><Typography.Text strong>{room?.name}</Typography.Text></Descriptions.Item>
                        <Descriptions.Item label="Khách thuê">{tenant?.full_name}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{tenant?.phone || '---'}</Descriptions.Item>
                        <Descriptions.Item label="Kỳ thanh toán"><Tag color="blue">{invoice.month}</Tag></Descriptions.Item>
                        <Descriptions.Item label="Hạn thanh toán">
                            <Typography.Text type="danger">{invoice.due_date ? dayjs(invoice.due_date).format('DD/MM/YYYY') : '---'}</Typography.Text>
                        </Descriptions.Item>
                    </Descriptions>

                    <Typography.Title level={5} className="mb-4">Chi tiết các khoản phí</Typography.Title>
                    <Table
                        columns={columns}
                        dataSource={items}
                        rowKey="id"
                        pagination={false}
                        bordered
                    />

                    <div className="flex justify-end mt-6">
                        <div className="w-full md:w-1/2 lg:w-1/3">
                            <div className="flex justify-between py-2 border-b">
                                <Typography.Text>Tổng cổng:</Typography.Text>
                                <Typography.Text strong className="text-lg">{Number(invoice.total_amount).toLocaleString()} đ</Typography.Text>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <Typography.Text>Đã thanh toán:</Typography.Text>
                                <Typography.Text type="success" strong>{Number(invoice.paid_amount).toLocaleString()} đ</Typography.Text>
                            </div>
                            <div className="flex justify-between py-3">
                                <Typography.Text strong className="text-lg text-gray-700">Còn lại:</Typography.Text>
                                <Typography.Text type="danger" strong className="text-xl">{remaining.toLocaleString()} đ</Typography.Text>
                            </div>
                        </div>
                    </div>
                </Card>

                <PaymentSection 
                    invoice={invoice as unknown as Partial<Invoice> & { id: string, total_amount: number | string, paid_amount: number | string }} 
                    paymentSettings={paymentSettings as unknown as import('@/types/database').PaymentSettingsFormData} 
                    hasPayosConfig={hasPayosConfig} 
                />
            </div>
        </>
    );
}
