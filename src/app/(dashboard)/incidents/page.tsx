import PageHeader from '@/components/common/PageHeader';
import IncidentsClient from './IncidentsClient';
import { getIncidents } from './actions';
import { getBuildings } from '@/app/(dashboard)/buildings/actions';
import { createClient } from '@/lib/supabase/server';

export default async function IncidentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userRole = 'member';
    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        userRole = profile?.role || 'member';
    }

    const [{ data: incidents, error: incidentsError }, { data: buildings, error: buildingsError }] = await Promise.all([
        getIncidents(),
        getBuildings()
    ]);

    const error = incidentsError || buildingsError;

    return (
        <>
            <PageHeader
                title="Quản lý Sự cố"
                subtitle="Theo dõi và xử lý các yêu cầu sửa chữa, bảo trì từ khách thuê hoặc ban quản lý."
            />
            {error ? (
                <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold">Lỗi tải dữ liệu:</p>
                    <p>{error}</p>
                </div>
            ) : null}
            <div className="mt-4">
                <IncidentsClient
                    initialData={incidents || []}
                    buildings={buildings || []}
                    userRole={userRole}
                    userId={user?.id || ''}
                />
            </div>
        </>
    );
}
