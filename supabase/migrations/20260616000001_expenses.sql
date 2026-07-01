-- Create expense category enum
CREATE TYPE public.expense_category AS ENUM (
  'electricity',
  'water',
  'internet',
  'garbage',
  'maintenance',
  'salary',
  'marketing',
  'other'
);

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id uuid REFERENCES public.buildings(id) ON DELETE SET NULL,
  category public.expense_category NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  date date NOT NULL,
  description text,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX idx_expenses_org_id ON public.expenses(org_id);
CREATE INDEX idx_expenses_building_id ON public.expenses(building_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view expenses in their organization"
ON public.expenses FOR SELECT
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert expenses in their organization"
ON public.expenses FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update expenses in their organization"
ON public.expenses FOR UPDATE
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete expenses in their organization"
ON public.expenses FOR DELETE
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));
