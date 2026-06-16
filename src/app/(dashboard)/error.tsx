'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { SyncOutlined, HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Result
                status="500"
                title="Đã xảy ra lỗi"
                subTitle="Hệ thống gặp sự cố không mong muốn trong quá trình xử lý. Xin vui lòng thử lại."
                extra={[
                    <Button
                        key="retry"
                        type="primary"
                        icon={<SyncOutlined />}
                        onClick={() => reset()}
                        style={{ backgroundColor: '#0d9488' }}
                    >
                        Thử lại
                    </Button>,
                    <Link href="/dashboard" key="home">
                        <Button icon={<HomeOutlined />}>
                            Về trang chủ
                        </Button>
                    </Link>
                ]}
            />
        </div>
    );
}
