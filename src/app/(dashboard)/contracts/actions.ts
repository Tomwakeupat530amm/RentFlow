'use server';

import { createClient } from '@/lib/supabase/server';
import type { ContractFormData, ContractStatus, SettlementData } from '@/types/database';
import { revalidatePath } from 'next/cache';
import { getTenantSession } from '@/lib/tenant-auth';
import { getOrgId } from '@/lib/rbac/guard';

// Helper: Phòng hiện tại của khách thuê được tính động qua bảng contracts (status='active')
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
async function syncTenantRoom(_supabase: any, _tenantId: string) {
    // Không thao tác vào bảng tenants vì schema tenants không có cột room_id;
    // Tenant Portal và API login đều tự động lookup active contract.
    return;
}

export async function getContracts() {
    const supabase = await createClient();
    const orgId = await getOrgId();
    if (!orgId) return { data: null, error: 'Chưa đăng nhập' };

    const { data, error } = await supabase
        .from('contracts')
        .select(`
            *,
            room:rooms(id, name, building:buildings(id, name)),
            tenant:tenants(id, full_name, phone, id_number)
        `)
        .eq('org_id', orgId)
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
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Không tìm thấy tổ chức. Vui lòng đăng nhập lại.' };

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
        .eq('id', id)
        .eq('org_id', orgId);

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
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Không tìm thấy tổ chức. Vui lòng đăng nhập lại.' };

    const { data: contract } = await supabase
        .from('contracts')
        .select('tenant_id')
        .eq('id', id)
        .eq('org_id', orgId)
        .maybeSingle();

    const { error } = await supabase
        .from('contracts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId);

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
    const orgId = await getOrgId();
    if (!orgId) return { error: 'Không tìm thấy tổ chức. Vui lòng đăng nhập lại.' };

    const { data: contract } = await supabase
        .from('contracts')
        .select('tenant_id')
        .eq('id', id)
        .eq('org_id', orgId)
        .maybeSingle();

    const { error } = await supabase
        .from('contracts')
        .update({ status })
        .eq('id', id)
        .eq('org_id', orgId);

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

    // 1. Lấy thông tin hợp đồng để đối chiếu danh tính
    const { data: contract, error: contractErr } = await supabase
        .from('contracts')
        .select('id, org_id, tenant_id')
        .eq('id', contractId)
        .single();

    if (contractErr || !contract) {
        return { error: 'Không tìm thấy hợp đồng.' };
    }

    const updateData: SignContractData = {};

    // 2. Kiểm tra quyền hạn theo vai trò
    if (role === 'owner') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Chưa đăng nhập tài khoản quản trị.' };

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile || profile.org_id !== contract.org_id) {
            return { error: 'Bạn không có quyền ký hợp đồng này với vai trò chủ sở hữu.' };
        }

        updateData.signed_by_owner = true;
        updateData.owner_signed_at = new Date().toISOString();
    } else {
        // Kiểm tra danh tính khách thuê từ Portal Session hoặc auth user
        const tenantSession = await getTenantSession();
        const { data: { user } } = await supabase.auth.getUser();

        const isAuthorizedTenant = 
            (tenantSession && tenantSession.id === contract.tenant_id) ||
            (user && user.id === contract.tenant_id);

        if (!isAuthorizedTenant) {
            return { error: 'Bạn không phải là khách thuê thuộc hợp đồng này.' };
        }

        updateData.signed_by_tenant = true;
        updateData.tenant_signed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)
        .eq('org_id', contract.org_id);

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
