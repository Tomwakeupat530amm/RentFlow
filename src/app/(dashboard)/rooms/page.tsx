import PageHeader from '@/components/common/PageHeader';
import { getAllRooms } from './actions';
import RoomsClient from './RoomsClient';
import { getOrgPlan, getOrgUsage } from '@/lib/subscription/actions';
import { FREE_TIER_LIMITS } from '@/types/database';

export default async function RoomsPage() {
    const [{ data: rooms }, { planType }, usage] = await Promise.all([
        getAllRooms(),
        getOrgPlan(),
        getOrgUsage(),
    ]);

    return (
        <>
            <PageHeader
                title="Quản lý Phòng"
                subtitle="Danh sách tất cả phòng thuộc các toà nhà trong tổ chức."
            />
            <RoomsClient 
                initialRooms={rooms || []} 
                roomCount={usage.room_count}
                limit={FREE_TIER_LIMITS.MAX_ROOMS}
                planType={planType}
            />
        </>
    );
}
