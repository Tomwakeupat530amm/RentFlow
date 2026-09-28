-- ==============================================================================
-- Migration: Add paid_at timestamp to public.invoices
-- Date: 2026-09-28
-- Description:
-- Adds paid_at column to invoices table to record exact timestamp when invoice was fully paid
-- ==============================================================================

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Optional index for querying invoices by payment date
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at 
ON public.invoices(paid_at) 
WHERE paid_at IS NOT NULL;
