import React from 'react';
import { Typography } from 'antd';
import ActivityLogsClient from './Client';
import { getActivityLogs } from './actions';

const { Title } = Typography;

export default async function ActivityLogsPage() {
    const initialLogs = await getActivityLogs();

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2}>Nhật ký hoạt động</Title>
            <ActivityLogsClient initialLogs={initialLogs} />
        </div>
    );
}
