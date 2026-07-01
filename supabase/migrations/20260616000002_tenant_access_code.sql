-- Add access_code to tenants for Tenant Portal authentication
ALTER TABLE public.tenants
ADD COLUMN access_code VARCHAR(6);

COMMENT ON COLUMN public.tenants.access_code IS '6-digit PIN code for Tenant Portal login';
