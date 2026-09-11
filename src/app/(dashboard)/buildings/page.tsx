import { getBuildings } from './actions';
import BuildingsClient from './BuildingsClient';
import PageHeader from '@/components/common/PageHeader';
import { getOrgPlan, getOrgUsage } from '@/lib/subscription/actions';
import { FREE_TIER_LIMITS } from '@/types/database';

export default async function BuildingsPage() {
    const [{ data: buildings, error }, { planType }, usage] = await Promise.all([
        getBuildings(),
        getOrgPlan(),
        getOrgUsage(),
    ]);

    return (
        <>
            <PageHeader
                title="Quản lý Toà nhà"
                subtitle="Quản lý danh sách toà nhà, thêm mới hoặc chỉnh sửa thông tin."
            />
            <BuildingsClient 
                initialBuildings={buildings || []} 
                serverError={error} 
                buildingCount={usage.building_count}
                limit={FREE_TIER_LIMITS.MAX_BUILDINGS}
                planType={planType}
            />
        </>
    );
}
