'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import theme from './themeConfig';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <ConfigProvider theme={theme}>
            <App>{children}</App>
        </ConfigProvider>
    );
}
