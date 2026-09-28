import PageHeader from '@/components/common/PageHeader';
import { getAllRooms } from './actions';
import RoomsClient from './RoomsClient';
import { getOrgPlan, getOrgUsage } from '@/lib/subscription/actions';
import { FREE_TIER_LIMITS } from '@/types/database';
import { getBuildings } from '@/app/(dashboard)/buildings/actions';

export default async function RoomsPage() {
    const [{ data: rooms }, { planType }, usage, { data: buildings }] = await Promise.all([
        getAllRooms(),
        getOrgPlan(),
        getOrgUsage(),
        getBuildings(),
    ]);

    return (
        <>
            <PageHeader
                title="Quản lý Phòng"
                subtitle="Danh sách tất cả phòng thuộc các toà nhà trong tổ chức."
            />
            <RoomsClient 
                initialRooms={rooms || []} 
                buildings={(buildings || []).map((b) => ({ id: (b as { id: string }).id, name: (b as { name: string }).name }))}
                roomCount={usage.room_count}
                limit={FREE_TIER_LIMITS.MAX_ROOMS}
                planType={planType}
            />
        </>
    );
}
