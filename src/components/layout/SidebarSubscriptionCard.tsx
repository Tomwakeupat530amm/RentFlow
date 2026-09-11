'use client';

import React from 'react';
import Link from 'next/link';
import { Tooltip, Progress } from 'antd';
import { CrownFilled, ThunderboltFilled } from '@ant-design/icons';
import type { PlanType } from '@/types/database';

interface Props {
    collapsed: boolean;
    planType?: PlanType;
    roomCount?: number;
    maxFreeRooms?: number;
}

export default function SidebarSubscriptionCard({
    collapsed,
    planType = 'free',
    roomCount = 0,
    maxFreeRooms = 5,
}: Props) {
    const isPremium = planType === 'premium';
    const percent = Math.min(100, Math.round((roomCount / maxFreeRooms) * 100));

    // Collapsed View (Chỉ icon)
    if (collapsed) {
        if (isPremium) {
            return (
                <div className="py-4 flex justify-center border-t border-white/5">
                    <Tooltip title="Tài khoản Premium (Không giới hạn)" placement="right">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                            <CrownFilled style={{ color: '#f59e0b', fontSize: 20 }} />
                        </div>
                    </Tooltip>
                </div>
            );
        }

        return (
            <div className="py-4 flex justify-center border-t border-white/5">
                <Tooltip title={`Gói Miễn phí (${roomCount}/${maxFreeRooms} phòng) - Nâng cấp`} placement="right">
                    <Link href="/pricing" className="block">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                            <ThunderboltFilled style={{ color: '#14b8a6', fontSize: 18 }} />
                        </div>
                    </Link>
                </Tooltip>
            </div>
        );
    }

    // Expanded View
    return (
        <div className="p-3 border-t border-white/5">
            {isPremium ? (
                <div 
                    className="p-3 rounded-xl border transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
                        borderColor: 'rgba(245, 158, 11, 0.25)',
                    }}
                >
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <CrownFilled style={{ color: '#f59e0b', fontSize: 16 }} />
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-semibold text-amber-400 tracking-tight leading-tight">
                                Gói Premium
                            </div>
                            <div className="text-xs text-slate-400 leading-tight mt-0.5 truncate">
                                Không giới hạn tài nguyên
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div 
                    className="p-3 rounded-xl border transition-all"
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'rgba(255, 255, 255, 0.07)',
                    }}
                >
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-300">Gói Miễn phí</span>
                        <span className="text-xs font-semibold text-teal-400">
                            {roomCount}/{maxFreeRooms} phòng
                        </span>
                    </div>

                    <Progress 
                        percent={percent} 
                        size="small" 
                        showInfo={false}
                        strokeColor={percent >= 90 ? '#ef4444' : percent >= 70 ? '#f59e0b' : '#0d9488'}
                        trailColor="rgba(255,255,255,0.08)"
                        className="m-0 mb-2.5"
                    />

                    <Link 
                        href="/pricing" 
                        className="w-full flex items-center justify-center py-1.5 px-3 rounded-lg text-xs font-semibold text-white transition-all shadow-sm"
                        style={{
                            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                        }}
                    >
                        <ThunderboltFilled className="mr-1.5 text-amber-300" />
                        Nâng cấp ngay
                    </Link>
                </div>
            )}
        </div>
    );
}
