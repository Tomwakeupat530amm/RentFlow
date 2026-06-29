'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { RoomFormData, ServicePriceFormData } from '@/types/database';
import { canAddRoom } from '@/lib/subscription/actions';

export type ActionResponse<T = unknown> = {
    success?: boolean;
    error?: string;
    requiresUpgrade?: boolean;
    featureName?: string;
    duplicates?: string[];
    count?: number;
    data?: T;
};

// ─── LIST ROOMS BY BUILDING ───

export async function getRoomsByBuilding(buildingId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('building_id', buildingId)
        .is('deleted_at', null)
        .order('floor', { ascending: true })
        .order('name', { ascending: true });

    if (error) return { error: error.message, data: [] };
    return { data: data || [] };
}

// ─── GET BUILDING DETAIL ───

export async function getBuildingDetail(buildingId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single();

    if (error) return { error: error.message, data: null };
    return { data };
}

// ─── CREATE ROOM ───

export async function createRoom(buildingId: string, formData: RoomFormData): Promise<ActionResponse> {
    // Check free tier room limit
    const roomCheck = await canAddRoom(1);
    if (!roomCheck.allowed) {
        return {
            error: `Gói Free chỉ cho phép tối đa ${roomCheck.limit} phòng. Nâng cấp Premium để không giới hạn!`,
            requiresUpgrade: true,
            featureName: 'Không giới hạn phòng'
        };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('rooms')
        .insert({
            building_id: buildingId,
            name: formData.name,
            floor: formData.floor,
            area_m2: formData.area_m2 || null,
            room_type: formData.room_type,
            default_rent: formData.default_rent,
            status: formData.status,
            notes: formData.notes || null,
        });

    if (error) return { error: error.message };

    revalidatePath(`/buildings/${buildingId}`);
    return { success: true };
}

// ─── UPDATE ROOM ───

export async function updateRoom(roomId: string, buildingId: string, formData: RoomFormData): Promise<ActionResponse> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('rooms')
        .update({
            name: formData.name,
            floor: formData.floor,
            area_m2: formData.area_m2 || null,
            room_type: formData.room_type,
            default_rent: formData.default_rent,
            status: formData.status,
            notes: formData.notes || null,
        })
        .eq('id', roomId);

    if (error) return { error: error.message };

    revalidatePath(`/buildings/${buildingId}`);
    return { success: true };
}

// ─── DELETE ROOM ───

export async function deleteRoom(roomId: string, buildingId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('rooms')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', roomId);

    if (error) return { error: error.message };

    revalidatePath(`/buildings/${buildingId}`);
    return { success: true };
}

// ─── BULK IMPORT ROOMS (CSV) ───

export async function bulkImportRooms(buildingId: string, rooms: RoomFormData[]) {
    const supabase = await createClient();

    const insertData = rooms.map((room) => ({
        building_id: buildingId,
        name: room.name,
        floor: room.floor,
        area_m2: room.area_m2 || null,
        room_type: room.room_type || 'single',
        default_rent: room.default_rent || 0,
        status: room.status || 'vacant',
        notes: room.notes || null,
    }));

    const { error, data } = await supabase
        .from('rooms')
        .insert(insertData)
        .select();

    if (error) return { error: error.message, count: 0 };

    revalidatePath(`/buildings/${buildingId}`);
    return { success: true, count: data?.length || 0 };
}

// ─── BULK CREATE MULTIPLE ROOMS (WITH DUPLICATE VALIDATION) ───

export async function bulkCreateMultipleRooms(buildingId: string, roomNames: string[], sharedData: Omit<RoomFormData, 'name'>): Promise<ActionResponse> {
    // Check free tier room limit
    const roomCheck = await canAddRoom(roomNames.length);
    if (!roomCheck.allowed) {
        return {
            error: `Gói Free chỉ cho phép tối đa ${roomCheck.limit} phòng. Nâng cấp Premium để không giới hạn!`,
            requiresUpgrade: true,
            featureName: 'Không giới hạn phòng'
        };
    }

    const supabase = await createClient();

    // 1. Check for duplicate room names in the current building
    const { data: existingRooms, error: checkError } = await supabase
        .from('rooms')
        .select('name')
        .eq('building_id', buildingId)
        .in('name', roomNames);

    if (checkError) {
        return { error: 'Lỗi khi kiểm tra dữ liệu phòng: ' + checkError.message };
    }

    if (existingRooms && existingRooms.length > 0) {
        const duplicates = existingRooms.map(r => r.name);
        return {
            error: `Các phòng sau đã tồn tại trong tòa nhà: ${duplicates.join(', ')}`,
            duplicates
        };
    }

    // 2. Prepare data for bulk insert
    const insertData = roomNames.map((name) => ({
        building_id: buildingId,
        name: name,
        floor: sharedData.floor,
        area_m2: sharedData.area_m2 || null,
        room_type: sharedData.room_type || 'single',
        default_rent: sharedData.default_rent || 0,
        status: sharedData.status || 'vacant',
        notes: sharedData.notes || null,
    }));

    // 3. Execute bulk insert
    const { error: insertError, data } = await supabase
        .from('rooms')
        .insert(insertData)
        .select();

    if (insertError) {
        return { error: 'Lỗi khi tạo danh sách phòng: ' + insertError.message };
    }

    revalidatePath(`/buildings/${buildingId}`);
    return { success: true, count: data?.length || 0 };
}

// ─── GET SERVICE PRICES ───

export async function getServicePrices(buildingId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .eq('building_id', buildingId);

    if (error) return { error: error.message, data: [] };
    return { data: data || [] };
}

// ─── UPSERT SERVICE PRICES ───

export async function upsertServicePrices(buildingId: string, prices: ServicePriceFormData[]) {
    const supabase = await createClient();

    // To simplify: delete existing and insert new ones
    const { error: deleteError } = await supabase
        .from('service_prices')
        .delete()
        .eq('building_id', buildingId);

    if (deleteError) return { error: deleteError.message };

    const insertData = prices.map(p => ({
        building_id: buildingId,
        service_type: p.service_type,
        label: p.label,
        unit_price: p.unit_price,
        unit: p.unit || '',
        is_metered: p.is_metered
    }));

    if (insertData.length > 0) {
        const { error: insertError } = await supabase
            .from('service_prices')
            .insert(insertData);

        if (insertError) return { error: insertError.message };
    }

    revalidatePath(`/buildings/${buildingId}`);
    return { success: true };
}
