const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedHomestay() {
    console.log('Starting Homestay seeding...');
    
    // 1. Get first organization and building
    const { data: orgs, error: orgErr } = await supabase.from('organizations').select('id').limit(1);
    if (orgErr || !orgs.length) return console.error('No organization found.');
    const orgId = orgs[0].id;

    const { data: buildings, error: buildErr } = await supabase.from('buildings').select('id').eq('org_id', orgId).limit(1);
    if (buildErr || !buildings.length) return console.error('No building found.');
    const buildingId = buildings[0].id;

    console.log(`Using Org: ${orgId}, Building: ${buildingId}`);

    // 2. Insert Homestay Rooms
    const roomsToInsert = [
        { building_id: buildingId, name: '101 - Homestay', floor: 1, room_type: 'single', default_rent: 400000, status: 'vacant' },
        { building_id: buildingId, name: '102 - Homestay', floor: 1, room_type: 'double', default_rent: 600000, status: 'vacant' },
        { building_id: buildingId, name: '201 - Homestay VIP', floor: 2, room_type: 'studio', default_rent: 850000, status: 'vacant' },
        { building_id: buildingId, name: '202 - Homestay', floor: 2, room_type: 'single', default_rent: 400000, status: 'vacant' }
    ];

    const { data: insertedRooms, error: roomErr } = await supabase
        .from('rooms')
        .insert(roomsToInsert)
        .select();

    if (roomErr) return console.error('Error inserting rooms:', roomErr);
    console.log(`Inserted ${insertedRooms.length} rooms.`);

    // 3. Insert Bookings for these rooms
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const addDays = (d, days) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + days);
        return nd;
    };

    const bookingsToInsert = [
        {
            org_id: orgId, building_id: buildingId, room_id: insertedRooms[0].id,
            guest_name: 'Nguyễn Văn A', guest_phone: '0901234567',
            check_in_date: formatDate(today), check_out_date: formatDate(addDays(today, 3)),
            total_amount: 1200000, paid_amount: 1200000,
            status: 'checked_in', payment_status: 'paid'
        },
        {
            org_id: orgId, building_id: buildingId, room_id: insertedRooms[0].id,
            guest_name: 'Trần Thị B', guest_phone: '0987654321',
            check_in_date: formatDate(addDays(today, 4)), check_out_date: formatDate(addDays(today, 6)),
            total_amount: 800000, paid_amount: 0,
            status: 'confirmed', payment_status: 'unpaid'
        },
        {
            org_id: orgId, building_id: buildingId, room_id: insertedRooms[1].id,
            guest_name: 'Lê Hoàng C', guest_phone: '0912345678',
            check_in_date: formatDate(addDays(today, -2)), check_out_date: formatDate(addDays(today, 2)),
            total_amount: 2400000, paid_amount: 1000000,
            status: 'checked_in', payment_status: 'partial'
        },
        {
            org_id: orgId, building_id: buildingId, room_id: insertedRooms[2].id,
            guest_name: 'Phạm D', guest_phone: '0909090909',
            check_in_date: formatDate(addDays(today, 1)), check_out_date: formatDate(addDays(today, 5)),
            total_amount: 3400000, paid_amount: 3400000,
            status: 'pending', payment_status: 'paid'
        }
    ];

    const { data: insertedBookings, error: bookingErr } = await supabase
        .from('bookings')
        .insert(bookingsToInsert)
        .select();

    if (bookingErr) return console.error('Error inserting bookings:', bookingErr);
    console.log(`Inserted ${insertedBookings.length} bookings.`);
    console.log('Seed Homestay complete!');
}

seedHomestay();
