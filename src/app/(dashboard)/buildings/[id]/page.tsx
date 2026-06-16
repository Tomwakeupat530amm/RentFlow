import { getBuildingDetail, getRoomsByBuilding, getServicePrices } from './actions';
import BuildingDetailClient from './BuildingDetailClient';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function BuildingDetailPage({ params }: Props) {
    const { id } = await params;

    const [buildingResult, roomsResult, servicePricesResult] = await Promise.all([
        getBuildingDetail(id),
        getRoomsByBuilding(id),
        getServicePrices(id),
    ]);

    if (!buildingResult.data) {
        notFound();
    }

    return (
        <BuildingDetailClient
            building={buildingResult.data}
            initialRooms={roomsResult.data || []}
            initialServicePrices={servicePricesResult.data || []}
        />
    );
}
