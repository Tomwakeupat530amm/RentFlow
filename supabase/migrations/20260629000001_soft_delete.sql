-- Add soft delete column to core entities to preserve reporting data
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Note: RLS policies generally do not filter deleted_at out globally 
-- so that revenue reports can still JOIN with deleted entities.
-- The application layer must append `.is('deleted_at', null)` on normal list views.
