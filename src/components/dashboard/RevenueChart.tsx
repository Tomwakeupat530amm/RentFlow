'use client';

import React from 'react';
import { Card } from 'antd';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';



interface RevenueData {
    month: string;
    revenue: number;
    collected: number;
    expenses?: number;
    profit?: number;
}

interface Props {
    data: RevenueData[];
}

export default function RevenueChart({ data }: Props) {
    // Format the month label from "YYYY-MM" to "MM/YYYY"
    const formattedData = data.map(item => ({
        ...item,
        displayMonth: item.month.split('-').reverse().join('/'),
        expenses: item.expenses || 0,
        profit: item.profit || 0,
    }));

    const formatCurrency = (value: number) => {
        if (value >= 1000000 || value <= -1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000 || value <= -1000) {
            return `${(value / 1000).toFixed(0)}K`;
        }
        return value.toString();
    };

    return (
        <Card
            variant="borderless"
            style={{ borderRadius: 12 }}
            title={<span style={{ fontWeight: 700, fontSize: 15 }}>Lợi Nhuận (P&L) 6 tháng qua</span>}
        >
            <div style={{ height: 350, width: '100%', marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={formattedData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="displayMonth"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            tickFormatter={formatCurrency}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dx={-10}
                        />
                        <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`${Number(value || 0).toLocaleString()} đ`, '']}
                        />
                        <Legend wrapperStyle={{ paddingTop: 20 }} />
                        <Bar
                            name="Thực Thu (Đã thanh toán)"
                            dataKey="collected"
                            fill="#0d9488"
                            radius={[4, 4, 0, 0]}
                            barSize={16}
                        />
                        <Bar
                            name="Tổng Chi (Expenses)"
                            dataKey="expenses"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                            barSize={16}
                        />
                        <Bar
                            name="Lợi Nhuận (Profit)"
                            dataKey="profit"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            barSize={16}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
