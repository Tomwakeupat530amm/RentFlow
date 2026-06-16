'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { BookingFormData } from '@/types/database';

export async function createBooking(data: BookingFormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) return { error: 'Organization not found' };

        const { error } = await supabase
            .from('bookings')
            .insert({
                ...data,
                org_id: profile.org_id,
            });

        if (error) {
            console.error('Error creating booking:', error);
            // Catch the custom double-booking trigger exception
            if (error.message.includes('Double booking prevented')) {
                return { error: 'Phòng đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác!' };
            }
            return { error: 'Không thể thêm lịch đặt phòng. Vui lòng thử lại.' };
        }

        revalidatePath('/homestay/bookings');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
        return { error: message };
    }
}

export async function updateBooking(id: string, data: Partial<BookingFormData>) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('bookings')
            .update(data)
            .eq('id', id);

        if (error) {
            console.error('Error updating booking:', error);
            if (error.message.includes('Double booking prevented')) {
                return { error: 'Phòng đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác!' };
            }
            return { error: 'Không thể cập nhật lịch đặt phòng.' };
        }

        revalidatePath('/homestay/bookings');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
        return { error: message };
    }
}

export async function deleteBooking(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting booking:', error);
            return { error: 'Không thể xóa lịch đặt phòng.' };
        }

        revalidatePath('/homestay/bookings');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
        return { error: message };
    }
}
