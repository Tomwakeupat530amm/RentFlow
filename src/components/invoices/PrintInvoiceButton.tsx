'use client';

import { Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

export default function PrintInvoiceButton() {
    return (
        <Button
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
            className="no-print"
        >
            In hoá đơn
        </Button>
    );
}
