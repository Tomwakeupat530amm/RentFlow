-- Create Incident ENUMs
CREATE TYPE incident_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE incident_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE reporter_type AS ENUM ('owner', 'member', 'tenant');

-- Create Incidents Table
CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    reporter_type reporter_type NOT NULL DEFAULT 'owner',
    reported_by UUID,
    title TEXT NOT NULL,
    description TEXT,
    image_urls TEXT[],
    status incident_status NOT NULL DEFAULT 'open',
    priority incident_priority NOT NULL DEFAULT 'medium',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at on incidents
CREATE TRIGGER set_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incidents in their organization"
ON public.incidents FOR SELECT
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert incidents in their organization"
ON public.incidents FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update incidents in their organization"
ON public.incidents FOR UPDATE
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete incidents in their organization"
ON public.incidents FOR DELETE
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));


-- Create Reminder ENUMs
CREATE TYPE reminder_entity_type AS ENUM ('contract', 'invoice', 'incident', 'other');

-- Create Reminders Table
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type reminder_entity_type NOT NULL DEFAULT 'other',
    entity_id UUID,
    message TEXT NOT NULL,
    due_date DATE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminders in their organization"
ON public.reminders FOR SELECT
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert reminders in their organization"
ON public.reminders FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update reminders in their organization"
ON public.reminders FOR UPDATE
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete reminders in their organization"
ON public.reminders FOR DELETE
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));
