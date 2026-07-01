-- Migration: Add payment transactions for Premium Upgrade

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    checkout_url TEXT,
    order_code BIGINT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Add transaction_id to subscriptions if needed
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL;

-- Set up Row Level Security
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org transactions"
    ON public.payment_transactions FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );
