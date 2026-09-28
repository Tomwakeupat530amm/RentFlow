import { getTenants } from './actions';
import TenantsClient from './TenantsClient';
import PageHeader from '@/components/common/PageHeader';
import { getOrgPlan } from '@/lib/subscription/actions';

export default async function TenantsPage() {
    const [{ data: tenants, error }, orgPlan] = await Promise.all([
        getTenants(),
        getOrgPlan(),
    ]);

    return (
        <>
            <PageHeader
                title="Quản lý Khách thuê"
                subtitle="Danh sách khách thuê, thêm mới hoặc chỉnh sửa thông tin."
            />
            <TenantsClient
                initialTenants={tenants || []}
                serverError={error}
                isPremium={orgPlan.planType === 'premium'}
            />
        </>
    );
}
