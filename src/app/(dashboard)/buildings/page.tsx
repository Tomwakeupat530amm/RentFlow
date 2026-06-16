import { getBuildings } from './actions';
import BuildingsClient from './BuildingsClient';
import PageHeader from '@/components/common/PageHeader';

export default async function BuildingsPage() {
    const { data: buildings, error } = await getBuildings();

    return (
        <>
            <PageHeader
                title="Quản lý Toà nhà"
                subtitle="Quản lý danh sách toà nhà, thêm mới hoặc chỉnh sửa thông tin."
            />
            <BuildingsClient initialBuildings={buildings || []} serverError={error} />
        </>
    );
}
