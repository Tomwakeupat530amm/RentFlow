import React from 'react';
import PortalLayoutClient from './PortalLayoutClient';

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Optionally fetch session here to pass down context if needed

    return <PortalLayoutClient>{children}</PortalLayoutClient>;
}
