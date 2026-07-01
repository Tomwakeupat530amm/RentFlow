-- Migration: Race Condition Prevention via Unique Indexes

-- 1. Prevent multiple active contracts for the same room
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_contract_per_room 
ON public.contracts (room_id) 
WHERE status = 'active' AND deleted_at IS NULL;

-- 2. Prevent duplicate invoices for the same room in the same month
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_invoice_per_room_month 
ON public.invoices (room_id, month);

-- 3. Prevent duplicate meter records for the same room in the same month
-- Dynamically checks if the column is named 'period', 'month', or 'record_month' to avoid column name mismatch errors.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'meter_records' AND column_name = 'period'
    ) THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_one_meter_record_per_room_month ON public.meter_records (room_id, period)';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'meter_records' AND column_name = 'month'
    ) THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_one_meter_record_per_room_month ON public.meter_records (room_id, month)';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'meter_records' AND column_name = 'record_month'
    ) THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_one_meter_record_per_room_month ON public.meter_records (room_id, record_month)';
    END IF;
END $$;
