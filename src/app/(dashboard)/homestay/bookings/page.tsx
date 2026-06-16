import React from 'react';
import { createClient } from '@/lib/supabase/server';
import dynamic from 'next/dynamic';

const TimelineCalendarClient = dynamic(() => import('./TimelineCalendarClient'), { 
    ssr: false, 
    loading: () => <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div> 
});

export const metadata = {
    title: 'Lịch Đặt Phòng Homestay | RentFlow',
};

export default async function HomestayBookingsPage() {
    const supabase = await createClient();
    
    // Fetch user org
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Unauthorized</div>;

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    const orgId = profile?.org_id;
    if (!orgId) return <div>No Organization found</div>;

    // Fetch rooms (ideally filtered by homestay type/building, here we fetch all for demo)
    const { data: rooms } = await supabase
        .from('rooms')
        .select('*, building:buildings(name)')
        .eq('buildings.org_id', orgId)
        .order('name');

    // Fetch active bookings (for the next 60 days)
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 60);
    const past = new Date();
    past.setDate(today.getDate() - 15);

    const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('org_id', orgId)
        .gte('check_out_date', past.toISOString().split('T')[0])
        .lte('check_in_date', future.toISOString().split('T')[0]);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h1 className="text-lg font-bold text-slate-800 m-0">Lịch Homestay</h1>
                <p className="text-sm text-slate-500 m-0">Quản lý đặt phòng dạng Timeline</p>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                <TimelineCalendarClient 
                    initialRooms={rooms || []} 
                    initialBookings={bookings || []} 
                />
            </div>
        </div>
    );
}
