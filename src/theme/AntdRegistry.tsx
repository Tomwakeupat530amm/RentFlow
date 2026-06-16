'use client';

import React from 'react';
import '@ant-design/v5-patch-for-react-19';
import { AntdRegistry } from '@ant-design/nextjs-registry';

const StyledComponentsRegistry = ({ children }: React.PropsWithChildren) => {
    return <AntdRegistry>{children}</AntdRegistry>;
};

export default StyledComponentsRegistry;
