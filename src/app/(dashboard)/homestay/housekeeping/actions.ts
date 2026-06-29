'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { HousekeepingTaskFormData, TaskStatus } from '@/types/database';

export async function createHousekeepingTask(data: HousekeepingTaskFormData) {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) {
        return { success: false, error: 'User does not belong to any organization' };
    }

    const { error } = await supabase
        .from('housekeeping_tasks')
        .insert({
            org_id: profile.org_id,
            ...data
        });

    if (error) {
        console.error('Lỗi khi tạo công việc dọn dẹp:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/homestay/housekeeping');
    return { success: true };
}

export async function updateHousekeepingTaskStatus(taskId: string, status: TaskStatus) {
    const supabase = await createClient();

    const updateData: Record<string, string> = { status };
    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('housekeeping_tasks')
        .update(updateData)
        .eq('id', taskId);

    if (error) {
        console.error('Lỗi khi cập nhật trạng thái dọn dẹp:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/homestay/housekeeping');
    return { success: true };
}
