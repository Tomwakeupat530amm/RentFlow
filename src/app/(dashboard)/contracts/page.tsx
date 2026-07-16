import PageHeader from '@/components/common/PageHeader';
import ContractsClient from './ContractsClient';
import { getContracts } from './actions';
import { getTenants } from '../tenants/actions';
import { createClient } from '@/lib/supabase/server';
import type { Room } from '@/types/database';

export default async function ContractsPage() {
    const supabase = await createClient();

    // Fetch rooms with buildings info
    const { data: rooms } = await supabase
        .from('rooms')
        .select(`
            *,
            building:buildings(id, name)
        `)
        .is('deleted_at', null)
        .order('building_id')
        .order('name');

    const [contractsResult, tenantsResult] = await Promise.all([
        getContracts(),
        getTenants(),
    ]);

    return (
        <>
            <PageHeader
                title="Hợp đồng"
                subtitle="Quản lý hợp đồng cho thuê, gia hạn hoặc thanh lý."
            />
            <ContractsClient
                initialContracts={contractsResult.data || []}
                rooms={(rooms as Room[]) || []}
                tenants={tenantsResult.data || []}
                serverError={contractsResult.error || tenantsResult.error}
            />
        </>
    );
}
