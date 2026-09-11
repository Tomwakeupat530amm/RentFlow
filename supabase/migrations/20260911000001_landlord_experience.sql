-- Migration: Landlord Experience P1 (Zalo, Check-out, Flexible Services)
-- Date: 2026-09-11

-- 1. Thêm số người ở, số lượng xe và dữ liệu quyết toán cọc vào bảng contracts
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS num_occupants INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS num_vehicles INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS settlement_data JSONB;

-- 2. Thêm quy tắc tính phí dịch vụ vào bảng service_prices
-- Giá trị: 'fixed' (theo phòng/tháng), 'metered' (theo đồng hồ), 'per_person' (theo người/tháng), 'per_vehicle' (theo xe/tháng)
ALTER TABLE public.service_prices 
ADD COLUMN IF NOT EXISTS charging_rule VARCHAR(30) DEFAULT 'fixed';

-- 3. Cập nhật giá trị charging_rule mặc định cho các dịch vụ đo đồng hồ hiện có
UPDATE public.service_prices 
SET charging_rule = 'metered' 
WHERE is_metered = true AND (charging_rule IS NULL OR charging_rule = 'fixed');

-- 4. Index hỗ trợ tra cứu quyết toán
CREATE INDEX IF NOT EXISTS idx_contracts_settlement ON public.contracts USING gin (settlement_data) WHERE settlement_data IS NOT NULL;
