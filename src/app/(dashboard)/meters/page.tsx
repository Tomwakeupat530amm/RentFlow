import PageHeader from '@/components/common/PageHeader';
import MetersClient from './MetersClient';
import { getBuildingsForMeters } from './actions';

export default async function MetersPage() {
    const { data: buildings, isPremium, error } = await getBuildingsForMeters();

    return (
        <>
            <PageHeader
                title="Ghi Điện Nước"
                subtitle="Ghi nhận chỉ số điện nước hàng tháng cho từng phòng để tự động tính hoá đơn."
            />
            {error ? (
                <div style={{ color: 'red' }}>Error: {error}</div>
            ) : buildings?.length ? (
                <MetersClient buildings={buildings} isPremium={isPremium} />
            ) : (
                <div style={{ padding: 24, textAlign: 'center' }}>
                    Chưa có toà nhà nào để ghi điện nước. Vui lòng tạo toà nhà trước.
                </div>
            )}
        </>
    );
}
