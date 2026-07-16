import React from 'react';
import { createClient } from '@/lib/supabase/server';
import HousekeepingClient from './HousekeepingClient';

export const metadata = {
    title: 'Quản lý Dọn dẹp | RentFlow',
};

export default async function HousekeepingPage() {
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

    // Fetch tasks joined with room info
    const { data: tasks } = await supabase
        .from('housekeeping_tasks')
        .select('*, room:rooms(name, floor)')
        .eq('org_id', orgId)
        .order('scheduled_date', { ascending: false });

    // Fetch rooms for the dropdown
    const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('name');
        
    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h1 className="text-lg font-bold text-slate-800 m-0">Quản lý dọn dẹp</h1>
                <p className="text-sm text-slate-500 m-0">Theo dõi trạng thái dọn phòng Homestay</p>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
                <HousekeepingClient initialTasks={tasks || []} rooms={rooms || []} />
            </div>
        </div>
    );
}
