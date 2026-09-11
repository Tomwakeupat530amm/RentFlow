-- ==============================================================================
-- RentFlow Core Hardening Migration
-- Date: 2026-09-11
-- Description:
-- 1. Adds order_code to public.invoices for PayOS reconciliation.
-- 2. Ensures access_code column exists on public.tenants for Tenant Portal PIN login.
-- 3. Adds unique index on public.reminders to prevent duplicate cron notifications.
-- ==============================================================================

-- 1. Invoices: add order_code for PayOS numeric orderCode tracking
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS order_code BIGINT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_invoices_order_code 
ON public.invoices(order_code);

-- 2. Tenants: ensure access_code column exists
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS access_code VARCHAR(6);

-- 3. Reminders: deduplication index per entity & date
CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_dedup 
ON public.reminders(org_id, entity_type, entity_id, due_date)
WHERE entity_id IS NOT NULL;
