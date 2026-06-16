'use client';

import React, { useRef } from 'react';
import { Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Invoice, InvoiceItem } from '@/types/database';

interface InvoiceExportProps {
    invoice: Invoice;
    items: InvoiceItem[];
    tenantName?: string;
    roomName?: string;
    buildingName?: string;
}

export default function InvoiceExport({ invoice, items, tenantName, roomName, buildingName }: InvoiceExportProps) {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!componentRef.current) return;

        const printContent = componentRef.current.innerHTML;

        // Setup a simple print view
        const printWindow = window.open('', '', 'width=800,height=900');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Hóa đơn ${invoice.title}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                        h1 { color: #0d9488; margin-bottom: 5px; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                        .company-info { text-align: right; }
                        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
                        th { background-color: #f9fafb; font-weight: 600; color: #4b5563; }
                        .total-row { font-weight: bold; background-color: #f0fdfa; color: #0f766e; }
                        .text-right { text-align: right; }
                        .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; }
                        .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 500; font-size: 14px; }
                        .status-paid { background-color: #dcfce7; color: #166534; }
                        .status-unpaid { background-color: #fee2e2; color: #991b1b; }
                        .signature-area { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px; }
                        .signature-box { text-align: center; }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <>
            <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                className="hover:text-teal-600 hover:border-teal-600"
            >
                In PDF
            </Button>

            {/* Hidden printable component */}
            <div style={{ display: 'none' }}>
                <div ref={componentRef} className="print-container">
                    <div className="header">
                        <div>
                            <h1>HÓA ĐƠN THU TIỀN</h1>
                            <p style={{ margin: '5px 0', color: '#6b7280' }}>
                                Số hóa đơn: #{invoice.id.substring(0, 8).toUpperCase()}<br />
                                Ngày tạo: {dayjs(invoice.created_at).format('DD/MM/YYYY')}
                            </p>
                        </div>
                        <div className="company-info">
                            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>{buildingName || 'Hệ thống Quản lý'}</h2>
                            <p style={{ margin: 0, color: '#6b7280' }}>
                                Phòng {roomName}<br />
                                Email: lienhe@example.com<br />
                                ĐT: 0123.456.789
                            </p>
                        </div>
                    </div>

                    <div className="invoice-details">
                        <div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#4b5563' }}>Khách hàng:</h3>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: '18px' }}>{tenantName || 'Khách thuê'}</p>
                            <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>Phòng {roomName}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#4b5563' }}>Kỳ thu tiền:</h3>
                            <p style={{ margin: 0, fontWeight: 500 }}>{invoice.title}</p>
                            <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>Hạn thanh toán: {invoice.due_date ? dayjs(invoice.due_date).format('DD/MM/YYYY') : '---'}</p>

                            <div style={{ marginTop: '15px' }}>
                                <span className={invoice.status === 'paid' ? 'status status-paid' : 'status status-unpaid'}>
                                    {invoice.status === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Nội dung</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                                <th className="text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>{item.description}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.unit_price)}</td>
                                    <td className="text-right font-medium">{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                            <tr className="total-row">
                                <td colSpan={4} className="text-right">Tổng cộng:</td>
                                <td className="text-right font-bold" style={{ fontSize: '16px' }}>{formatCurrency(invoice.total_amount)}</td>
                            </tr>
                            {invoice.paid_amount > 0 && (
                                <tr>
                                    <td colSpan={4} className="text-right" style={{ color: '#166534' }}>Đã thanh toán:</td>
                                    <td className="text-right" style={{ color: '#166534' }}>{formatCurrency(invoice.paid_amount)}</td>
                                </tr>
                            )}
                            {invoice.paid_amount > 0 && invoice.total_amount > invoice.paid_amount && (
                                <tr>
                                    <td colSpan={4} className="text-right font-bold" style={{ color: '#991b1b' }}>Còn lại:</td>
                                    <td className="text-right font-bold" style={{ color: '#991b1b' }}>{formatCurrency(invoice.total_amount - invoice.paid_amount)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="signature-area">
                        <div className="signature-box">
                            <p style={{ fontWeight: 600, marginBottom: '70px' }}>Khách hàng</p>
                            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
                        </div>
                        <div className="signature-box">
                            <p style={{ fontWeight: 600, marginBottom: '70px' }}>Người lập phiếu</p>
                            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>(Thông qua hệ thống phần mềm)</p>
                        </div>
                    </div>

                    <div className="footer">
                        <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
                        <p style={{ fontSize: '12px', marginTop: '5px' }}>Được tạo từ Hệ thống Quản lý Chung cư Mini vào lúc {dayjs().format('HH:mm DD/MM/YYYY')}</p>
                    </div>
                </div>
            </div>
        </>
    );
}
