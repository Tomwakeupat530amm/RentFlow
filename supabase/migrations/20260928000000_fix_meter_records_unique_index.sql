-- ==============================================================================
-- RentFlow Migration: Fix Meter Records Unique Constraint
-- Date: 2026-09-28
-- Description:
-- Sửa lỗi unique index không cho phép ghi nhận đồng thời cả điện và nước cho cùng 1 phòng trong cùng 1 kỳ/tháng.
-- Khớp hoàn toàn với mệnh đề onConflict: 'room_id, period, service_type' trong code ứng dụng.
-- ==============================================================================

-- 1. Xóa index cũ chỉ giới hạn trên (room_id, period)
DROP INDEX IF EXISTS public.idx_one_meter_record_per_room_month;

-- 2. Tạo index duy nhất chuẩn hóa trên (room_id, period, service_type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_meter_record_per_room_month_service 
ON public.meter_records (room_id, period, service_type);
