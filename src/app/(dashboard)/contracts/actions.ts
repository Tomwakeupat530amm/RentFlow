'use server';

import { createClient } from '@/lib/supabase/server';
import type { ContractFormData, ContractStatus, SettlementData } from '@/types/database';
import { revalidatePath } from 'next/cache';

// Helper: get current user's org_id
async function getOrgId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    return profile?.org_id || null;
}

// Helper: Tự động đồng bộ phòng hiện tại vào bảng tenants cho Tenant Portal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTenantRoom(supabase: any, tenantId: string) {
    if (!tenantId) return;
    const { data: activeContract } = await supabase
        .from('contracts')
        .select('room_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    await supabase
        .from('tenants')
        .update({ room_id: activeContract?.room_id || null })
        .eq('id', tenantId);
}

export async function getContracts() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contracts')
        .select(`
            *,
            room:rooms(id, name, building:buildings(id, name)),
            tenant:tenants(id, full_name, phone, id_number)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function createContract(formData: ContractFormData) {
    const supabase = await createClient();
    const orgId = await getOrgId();

    if (!orgId) return { error: 'Không tìm thấy tổ chức. Vui lòng đăng nhập lại.' };

    const { error } = await supabase
        .from('contracts')
        .insert({
            org_id: orgId,
            room_id: formData.room_id,
            tenant_id: formData.tenant_id,
            rent_amount: formData.rent_amount,
            deposit: formData.deposit || 0,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            status: formData.status,
            notes: formData.notes || null,
            num_occupants: formData.num_occupants || 1,
            num_vehicles: formData.num_vehicles || 0,
        });

    if (error) {
        if (error.message.includes('idx_one_active_contract_per_room')) {
            return { error: 'Phòng này đã có hợp đồng đang hoạt động. Vui lòng kiểm tra lại.' };
        }
        return { error: error.message };
    }

    if (formData.tenant_id) {
        await syncTenantRoom(supabase, formData.tenant_id);
    }

    revalidatePath('/contracts');
    revalidatePath('/rooms');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateContract(id: string, formData: ContractFormData & { scan_url?: string }) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('contracts')
        .update({
            room_id: formData.room_id,
            tenant_id: formData.tenant_id,
            rent_amount: formData.rent_amount,
            deposit: formData.deposit || 0,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            status: formData.status,
            scan_url: formData.scan_url || null,
            notes: formData.notes || null,
            num_occupants: formData.num_occupants || 1,
            num_vehicles: formData.num_vehicles || 0,
        })
        .eq('id', id);

    if (error) {
        if (error.message.includes('idx_one_active_contract_per_room')) {
            return { error: 'Phòng này đã có hợp đồng đang hoạt động. Vui lòng kiểm tra lại.' };
        }
        return { error: error.message };
    }

    if (formData.tenant_id) {
        await syncTenantRoom(supabase, formData.tenant_id);
    }

    revalidatePath('/contracts');
    revalidatePath('/rooms');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteContract(id: string) {
    const supabase = await createClient();

    const { data: contract } = await supabase
        .from('contracts')
        .select('tenant_id')
        .eq('id', id)
        .maybeSingle();

    const { error } = await supabase
        .from('contracts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) return { error: error.message };

    if (contract?.tenant_id) {
        await syncTenantRoom(supabase, contract.tenant_id);
    }

    revalidatePath('/contracts');
    revalidatePath('/rooms');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateContractStatus(id: string, status: ContractStatus) {
    const supabase = await createClient();

    const { data: contract } = await supabase
        .from('contracts')
        .select('tenant_id')
        .eq('id', id)
        .maybeSingle();

    const { error } = await supabase
        .from('contracts')
        .update({ status })
        .eq('id', id);

    if (error) {
        if (error.message.includes('idx_one_active_contract_per_room')) {
            return { error: 'Phòng này đã có hợp đồng đang hoạt động. Vui lòng kiểm tra lại.' };
        }
        return { error: error.message };
    }

    if (contract?.tenant_id) {
        await syncTenantRoom(supabase, contract.tenant_id);
    }

    revalidatePath('/contracts');
    revalidatePath('/rooms');
    revalidatePath('/dashboard');
    return { success: true };
}

interface SignContractData {
    signed_by_owner?: boolean;
    owner_signed_at?: string;
    signed_by_tenant?: boolean;
    tenant_signed_at?: string;
}

export async function signContract(contractId: string, role: 'owner' | 'tenant') {
    const supabase = await createClient();
    const updateData: SignContractData = {};

    if (role === 'owner') {
        updateData.signed_by_owner = true;
        updateData.owner_signed_at = new Date().toISOString();
    } else {
        updateData.signed_by_tenant = true;
        updateData.tenant_signed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId);

    if (error) return { error: error.message };

    revalidatePath('/contracts');
    return { success: true };
}

// ============================================================================
// ROOMMATES (CO-TENANTS) ACTIONS
// ============================================================================

export interface RoommateFormData {
    full_name: string;
    phone?: string | null;
    id_number?: string | null;
    id_image_url?: string | null;
}

export async function createRoommate(contractId: string, formData: RoommateFormData) {
    const supabase = await createClient();
    const orgId = await getOrgId();

    if (!orgId) return { error: 'Không tìm thấy tổ chức.' };

    const { error } = await supabase
        .from('roommates')
        .insert({
            org_id: orgId,
            contract_id: contractId,
            full_name: formData.full_name,
            phone: formData.phone || null,
            id_number: formData.id_number || null,
            id_image_url: formData.id_image_url || null,
        });

    if (error) return { error: error.message };

    revalidatePath('/contracts');
    revalidatePath('/rooms');
    return { success: true };
}

export async function updateRoommate(id: string, formData: RoommateFormData) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('roommates')
        .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            id_number: formData.id_number || null,
            id_image_url: formData.id_image_url || null,
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/contracts');
    revalidatePath('/rooms');
    return { success: true };
}

export async function deleteRoommate(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('roommates')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/contracts');
    revalidatePath('/rooms');
    return { success: true };
}

// ============================================================================
// CHECK-OUT & DEPOSIT SETTLEMENT ACTIONS
// ============================================================================

export async function getLastMeterReadings(roomId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('meter_records')
        .select('service_type, new_reading, old_reading')
        .eq('room_id', roomId)
        .order('period', { ascending: false });

    if (error || !data) return { electricity: 0, water: 0 };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elec = data.find((r: any) => r.service_type === 'electricity');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const water = data.find((r: any) => r.service_type === 'water');

    return {
        electricity: Number(elec?.new_reading || elec?.old_reading || 0),
        water: Number(water?.new_reading || water?.old_reading || 0),
    };
}

export async function checkoutContract(contractId: string, settlementData: SettlementData) {
    const supabase = await createClient();

    // 1. Lấy thông tin hợp đồng hiện tại
    const { data: contract, error: contractErr } = await supabase
        .from('contracts')
        .select('id, room_id, tenant_id')
        .eq('id', contractId)
        .single();

    if (contractErr || !contract) {
        return { error: 'Không tìm thấy hợp đồng' };
    }

    // 2. Cập nhật hợp đồng: settlement_data, status = terminated, end_date
    const { error: updateContractErr } = await supabase
        .from('contracts')
        .update({
            settlement_data: settlementData,
            status: 'terminated',
            end_date: settlementData.checkout_date,
        })
        .eq('id', contractId);

    if (updateContractErr) {
        return { error: updateContractErr.message };
    }

    // 3. Cập nhật trạng thái phòng về 'vacant'
    if (contract.room_id) {
        await supabase
            .from('rooms')
            .update({ status: 'vacant' })
            .eq('id', contract.room_id);
    }

    // 4. Đồng bộ lại room_id cho tenant (sẽ thành null nếu không còn hợp đồng active)
    if (contract.tenant_id) {
        await syncTenantRoom(supabase, contract.tenant_id);
    }

    revalidatePath('/contracts');
    revalidatePath('/rooms');
    revalidatePath('/dashboard');
    revalidatePath('/invoices');

    return { success: true };
}
