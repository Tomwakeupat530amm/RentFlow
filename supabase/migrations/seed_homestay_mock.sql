-- ==========================================
-- SCRIPT MOCK DATA: HOMESTAY BOOKINGS
-- ==========================================
-- Chạy script này trong SQL Editor của Supabase để tạo dữ liệu mẫu cho Lịch Homestay.

DO $$
DECLARE
    v_org_id UUID;
    v_building_id UUID;
    v_room1 UUID;
    v_room2 UUID;
    v_room3 UUID;
    v_room4 UUID;
BEGIN
    -- 1. Lấy org_id và building_id đầu tiên
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    SELECT id INTO v_building_id FROM buildings WHERE org_id = v_org_id LIMIT 1;

    IF v_org_id IS NULL OR v_building_id IS NULL THEN
        RAISE NOTICE 'Vui lòng tạo Organization và Building trước khi chạy script này!';
        RETURN;
    END IF;

    -- 2. Thêm phòng Homestay
    INSERT INTO rooms (building_id, name, floor, room_type, default_rent, status)
    VALUES 
        (v_building_id, '101 - Homestay', 1, 'single', 400000, 'vacant'),
        (v_building_id, '102 - Homestay', 1, 'double', 600000, 'vacant'),
        (v_building_id, '201 - Homestay VIP', 2, 'studio', 850000, 'vacant'),
        (v_building_id, '202 - Homestay', 2, 'single', 400000, 'vacant')
    RETURNING id INTO v_room1; -- Lấy ID phòng cuối cùng

    -- (Lấy lại chính xác các UUID vừa tạo)
    SELECT id INTO v_room1 FROM rooms WHERE name = '101 - Homestay' AND building_id = v_building_id LIMIT 1;
    SELECT id INTO v_room2 FROM rooms WHERE name = '102 - Homestay' AND building_id = v_building_id LIMIT 1;
    SELECT id INTO v_room3 FROM rooms WHERE name = '201 - Homestay VIP' AND building_id = v_building_id LIMIT 1;
    SELECT id INTO v_room4 FROM rooms WHERE name = '202 - Homestay' AND building_id = v_building_id LIMIT 1;

    -- 3. Thêm Bookings mẫu
    INSERT INTO bookings (org_id, building_id, room_id, guest_name, guest_phone, check_in_date, check_out_date, total_amount, paid_amount, status, payment_status)
    VALUES 
        (v_org_id, v_building_id, v_room1, 'Nguyễn Văn A', '0901234567', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', 1200000, 1200000, 'checked_in', 'paid'),
        (v_org_id, v_building_id, v_room1, 'Trần Thị B', '0987654321', CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '6 days', 800000, 0, 'confirmed', 'unpaid'),
        (v_org_id, v_building_id, v_room2, 'Lê Hoàng C', '0912345678', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', 2400000, 1000000, 'checked_in', 'partial'),
        (v_org_id, v_building_id, v_room3, 'Phạm D', '0909090909', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '5 days', 3400000, 3400000, 'pending', 'paid');

    RAISE NOTICE 'Đã tạo thành công dữ liệu mẫu cho Homestay Bookings!';
END $$;
