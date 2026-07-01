-- Thêm các cột cho PayOS Integration
ALTER TABLE payment_settings
ADD COLUMN IF NOT EXISTS payos_client_id TEXT,
ADD COLUMN IF NOT EXISTS payos_api_key TEXT,
ADD COLUMN IF NOT EXISTS payos_checksum_key TEXT;
