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
