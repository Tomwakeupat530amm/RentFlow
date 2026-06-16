const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dlyywsupowsjadoaiqqj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseXl3c3Vwb3dzamFkb2FpcXFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMzNzEzMCwiZXhwIjoyMDg2OTEzMTMwfQ.FI-DoCakHtajysIUBx6_GlLJCmCrGkxBLiY1TBNMiuw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching buildings...");
    const { data: buildings, error: bError } = await supabase.from('buildings').select('*');
    if (bError) console.error("Buildings Error:", bError);
    else {
        console.log("Buildings:", buildings.map(b => ({ id: b.id, name: b.name })));

        for (const building of buildings) {
            console.log(`\nFetching rooms for building ${building.name} (${building.id})...`);
            const { data: rooms, error: rError } = await supabase
                .from('rooms')
                .select('id, name, status, floor')
                .eq('building_id', building.id);

            if (rError) console.error("Rooms Error:", rError);
            else {
                console.log(`Found ${rooms.length} rooms.`);
                if (rooms.length > 0) {
                    console.log(rooms);
                }
            }
        }
    }
}

run();
