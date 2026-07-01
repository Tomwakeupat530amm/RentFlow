-- Disable public access for existing buckets
UPDATE storage.buckets
SET public = false
WHERE id IN ('contracts', 'tenants');

-- Ensure incidents bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('incidents', 'incidents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- RLS is already enabled by default on storage.objects in Supabase
-- so we don't need to explicitly enable it.

-- Drop existing policies if any to avoid conflict (optional, but good practice for idempotent migrations)
DROP POLICY IF EXISTS "Users can access their org's files" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert files into their org" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their org's files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their org's files" ON storage.objects;

-- Create policies for storage objects
-- Note: (storage.foldername(name))[1] extracts the root folder name from the file path
-- We enforce that the root folder must exactly match the user's org_id.

CREATE POLICY "Users can access their org's files" ON storage.objects
FOR SELECT TO authenticated
USING ( 
  (storage.foldername(name))[1] = (SELECT org_id::text FROM public.user_profiles WHERE id = auth.uid()) 
);

CREATE POLICY "Users can insert files into their org" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK ( 
  (storage.foldername(name))[1] = (SELECT org_id::text FROM public.user_profiles WHERE id = auth.uid()) 
);

CREATE POLICY "Users can update their org's files" ON storage.objects
FOR UPDATE TO authenticated
USING ( 
  (storage.foldername(name))[1] = (SELECT org_id::text FROM public.user_profiles WHERE id = auth.uid()) 
);

CREATE POLICY "Users can delete their org's files" ON storage.objects
FOR DELETE TO authenticated
USING ( 
  (storage.foldername(name))[1] = (SELECT org_id::text FROM public.user_profiles WHERE id = auth.uid()) 
);
