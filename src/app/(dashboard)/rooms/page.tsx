import PageHeader from '@/components/common/PageHeader';
import { getAllRooms } from './actions';
import RoomsClient from './RoomsClient';

export default async function RoomsPage() {
    const { data: rooms } = await getAllRooms();

    return (
        <>
            <PageHeader
                title="Quản lý Phòng"
                subtitle="Danh sách tất cả phòng thuộc các toà nhà trong tổ chức."
            />
            <RoomsClient initialRooms={rooms || []} />
        </>
    );
}
