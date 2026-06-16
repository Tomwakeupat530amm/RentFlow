import React from 'react';
import { Skeleton } from 'antd';

export default function PortalLoading() {
    return (
        <div className="flex flex-col gap-4 p-4 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-4">
                <Skeleton.Input active size="large" className="w-48" />
                <Skeleton.Avatar active size="large" shape="circle" />
            </div>
            
            {/* Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4">
                <Skeleton.Button active className="w-full h-32 rounded-xl" />
                <Skeleton.Button active className="w-full h-32 rounded-xl" />
                <Skeleton.Button active className="w-full h-32 rounded-xl" />
            </div>
        </div>
    );
}
