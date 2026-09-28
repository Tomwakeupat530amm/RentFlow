import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

const TABLES = [
    'organizations',
    'user_profiles',
    'buildings',
    'rooms',
    'tenants',
    'contracts',
    'service_prices',
    'meter_records',
    'invoices',
    'invoice_items',
    'roommates',
    'subscriptions',
    'bank_transactions',
    'role_permissions',
    'bookings',
    'housekeeping_tasks',
    'payment_settings',
    'incidents',
    'reminders',
    'expenses',
    'payment_transactions',
    'activity_logs'
];

async function checkDatabaseCompatibility() {
    console.log('====================================================');
    console.log('🔍 AUDITING 22 DATABASE TABLES AGAINST SUPABASE LIVE');
    console.log('====================================================\n');

    const results = [];

    for (const table of TABLES) {
        try {
            const { data, count, error } = await supabaseAdmin
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                results.push({
                    table,
                    status: 'ERROR',
                    error: error.message,
                    count: 0
                });
                console.log(`❌ [${table}]: FAILED -> ${error.message}`);
            } else {
                // Also fetch 1 row to see actual columns
                const { data: sampleRow, error: sampleErr } = await supabaseAdmin
                    .from(table)
                    .select('*')
                    .limit(1);

                const sampleCols = sampleRow && sampleRow.length > 0 ? Object.keys(sampleRow[0]) : [];

                results.push({
                    table,
                    status: 'OK',
                    count: count ?? 0,
                    columns: sampleCols
                });
                console.log(`✅ [${table}]: OK (Rows: ${count ?? 0}${sampleCols.length > 0 ? `, Cols detected: ${sampleCols.length}` : ''})`);
            }
        } catch (e) {
            results.push({
                table,
                status: 'EXCEPTION',
                error: e.message,
                count: 0
            });
            console.log(`💥 [${table}]: EXCEPTION -> ${e.message}`);
        }
    }

    console.log('\n====================================================');
    console.log('SUMMARY AUDIT REPORT:');
    const okCount = results.filter(r => r.status === 'OK').length;
    console.log(`Total tables: ${TABLES.length}`);
    console.log(`Compatible & reachable: ${okCount}/${TABLES.length}`);
    console.log('====================================================');
}

checkDatabaseCompatibility();
