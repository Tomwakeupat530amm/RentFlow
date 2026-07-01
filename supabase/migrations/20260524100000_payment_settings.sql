-- ==============================================================================
-- Payment Settings Table
-- Stores the Static VietQR configuration for each organization
-- ==============================================================================

-- Create trigger function if it does not exist
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    bank_bin TEXT NOT NULL, -- Bank BIN from VietQR
    bank_account TEXT NOT NULL,
    account_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id)
);

-- Trigger for updated_at
CREATE TRIGGER set_timestamp_payment_settings
    BEFORE UPDATE ON payment_settings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment settings of their organization"
    ON payment_settings FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Owners can manage payment settings of their organization"
    ON payment_settings FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM user_profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );
