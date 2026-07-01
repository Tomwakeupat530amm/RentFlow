CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_org_id ON public.activity_logs(org_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- RLS Policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's activity logs" ON public.activity_logs
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM public.user_profiles WHERE id = auth.uid()));

-- The generic trigger function
CREATE OR REPLACE FUNCTION log_activity_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_org_id UUID;
    v_action VARCHAR(50);
    new_json JSONB;
    old_json JSONB;
    rec_json JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        new_json := row_to_json(NEW)::jsonb;
        rec_json := new_json;
        v_action := 'CREATE';
        
    ELSIF TG_OP = 'UPDATE' THEN
        new_json := row_to_json(NEW)::jsonb;
        old_json := row_to_json(OLD)::jsonb;
        rec_json := new_json;
        
        -- Ignore updates that don't change anything
        IF new_json = old_json THEN
            RETURN NEW;
        END IF;

        IF (new_json ->> 'deleted_at') IS NOT NULL AND (old_json ->> 'deleted_at') IS NULL THEN
            v_action := 'DELETE';
        ELSE
            v_action := 'UPDATE';
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        old_json := row_to_json(OLD)::jsonb;
        rec_json := old_json;
        v_action := 'DELETE';
    END IF;

    -- Dynamically resolve org_id
    IF rec_json ? 'org_id' THEN
        current_org_id := (rec_json ->> 'org_id')::UUID;
    END IF;
    
    IF current_org_id IS NULL AND rec_json ? 'building_id' THEN
        SELECT org_id INTO current_org_id FROM public.buildings WHERE id = (rec_json ->> 'building_id')::UUID;
    END IF;
    
    IF current_org_id IS NULL AND rec_json ? 'room_id' THEN
        SELECT b.org_id INTO current_org_id 
        FROM public.rooms r 
        JOIN public.buildings b ON r.building_id = b.id 
        WHERE r.id = (rec_json ->> 'room_id')::UUID;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_logs (org_id, actor_id, action, entity_type, entity_id, new_data)
        VALUES (current_org_id, auth.uid(), v_action, TG_TABLE_NAME, (rec_json ->> 'id')::UUID, new_json);
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_logs (org_id, actor_id, action, entity_type, entity_id, old_data, new_data)
        VALUES (current_org_id, auth.uid(), v_action, TG_TABLE_NAME, (rec_json ->> 'id')::UUID, old_json, new_json);
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.activity_logs (org_id, actor_id, action, entity_type, entity_id, old_data)
        VALUES (current_org_id, auth.uid(), v_action, TG_TABLE_NAME, (rec_json ->> 'id')::UUID, old_json);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to major tables
CREATE TRIGGER log_buildings_activity AFTER INSERT OR UPDATE OR DELETE ON public.buildings FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
CREATE TRIGGER log_rooms_activity AFTER INSERT OR UPDATE OR DELETE ON public.rooms FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
CREATE TRIGGER log_tenants_activity AFTER INSERT OR UPDATE OR DELETE ON public.tenants FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
CREATE TRIGGER log_contracts_activity AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
CREATE TRIGGER log_incidents_activity AFTER INSERT OR UPDATE OR DELETE ON public.incidents FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
CREATE TRIGGER log_invoices_activity AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
CREATE TRIGGER log_payment_transactions_activity AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
CREATE TRIGGER log_bookings_activity AFTER INSERT OR UPDATE OR DELETE ON public.bookings FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
CREATE TRIGGER log_housekeeping_tasks_activity AFTER INSERT OR UPDATE OR DELETE ON public.housekeeping_tasks FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();
