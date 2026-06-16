import { notFound } from 'next/navigation';
import RoomDetailClient from './RoomDetailClient';
import { getRoomInfo, getRoomContracts, getRoomMeterHistory } from './actions';
import type { Room, Contract, Tenant, MeterRecord } from '@/types/database';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function RoomDetailPage({ params }: Props) {
    const { id } = await params;

    const [roomRes, contractsRes, metersRes] = await Promise.all([
        getRoomInfo(id),
        getRoomContracts(id),
        getRoomMeterHistory(id)
    ]);

    if (roomRes.error || !roomRes.data) {
        notFound();
    }

    return (
        <RoomDetailClient
            room={roomRes.data as unknown as Room}
            contracts={contractsRes.data as unknown as (Contract & { tenant: Tenant | null })[]}
            meterHistory={metersRes.data as unknown as MeterRecord[]}
        />
    );
}
