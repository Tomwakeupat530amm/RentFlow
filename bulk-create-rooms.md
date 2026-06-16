# Kế hoạch phát triển chức năng Tạo phòng hàng loạt

## 1. Overview
Người dùng cần tạo nhiều phòng có cùng một đặc tính (Tầng, Diện tích, Giá thuê, Loại phòng, Trạng thái) trong cùng một toà nhà để tiết kiệm thời gian. Ý tưởng này giúp giải quyết vấn đề nhập liệu lặp tay của chủ toà nhà khi setup dữ liệu ban đầu.

## 2. Project Type
**WEB** (Next.js, Ant Design, Supabase) - Primary Agent: `frontend-specialist` + `backend-specialist`

## 3. Success Criteria
- [ ] Giao diện Modal tạo/sửa phòng bổ sung thêm tính năng tạo hàng loạt (vd: Tabs `Thêm 1 phòng` vs `Thêm nhiều phòng`).
- [ ] Tại tab `Thêm nhiều phòng`, người dùng nhập tên phòng dưới dạng danh sách ngăn cách bằng dấu phẩy (vd: `P101, P102, P103`).
- [ ] Các thông tin khác (Tầng, Loại phòng, Diện tích, Giá, Trạng thái) là tham số dùng chung.
- [ ] Nếu trong danh sách tạo có phát hiện trùng lặp tên phòng ĐÃ CÓ trong hệ thống thì:
  - Báo lỗi ngay lập tức, ngưng toàn bộ quá trình thêm các phòng.
  - Hiển thị phản hồi UI nhắc người dùng những tên phòng nào đang bị trùng ("Các phòng P101, P102 đã tồn tại").
- [ ] Lưu DB thành công với 1 thao tác bấm "Lưu".

## 4. Tech Stack
- **Frontend:** Next.js Server Actions (gọi API thao tác DB), Ant Design (Modal, Tabs, Form, Input.TextArea).
- **Backend:** Supabase (sử dụng query bulk insert và `in` filter query để tìm phòng trùng tên).

## 5. File Structure
- `src/app/(dashboard)/buildings/[id]/actions.ts` (Sửa đổi: Viết action thêm hàng loạt phòng kèm validation báo trùng).
- `src/app/(dashboard)/buildings/[id]/RoomFormModal.tsx` (Sửa đổi: Chuyển UI thành chế độ có 2 tabs).
- `src/app/(dashboard)/buildings/[id]/BulkRoomForm.tsx` (Thêm mới: Component form tách rời nếu `RoomFormModal` quá phức tạp, hoặc viết thẳng vào `RoomFormModal`).

## 6. Task Breakdown

### Task 1: Backend Action (Validate & Insert)
- **Agent**: `backend-specialist` 
- **Skill**: `api-patterns`
- **Priority**: P1
- **INPUT**: `buildingId`, danh sách `roomNames`, các thông số phòng dùng chung (`RoomFormData`).
- **OUTPUT**:
  - Truy vấn Supabase check tên phòng trùng (`select name from rooms where building_id = X and name in (danh sách)`).
  - Trả về mảng các phòng trùng nếu có `return { duplicates: ['P101'] }`.
  - Nếu hợp lệ thì gọi `.insert()` danh sách data.
- **VERIFY**: Action chạy đúng nếu đẩy danh sách không trùng thì tạo đủ DB, trùng thì trả về mảng cảnh báo.

### Task 2: Cập nhật Giao diện Modal (Tabs & Form)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 1
- **INPUT**: `RoomFormModal.tsx` hiện tại
- **OUTPUT**:
  - Tích hợp `Tabs` của Ant Design, gồm: "1 Phòng" (luồng hiện tại) và "Nhiều phòng" (luồng mới).
  - Áp dụng rules hiển thị cho "Tên phòng" ở Tab "Nhiều phòng" (có thể dùng TextArea).
  - Tích hợp gọi Action từ Task 1 khi submit. Hiển thị thông báo Alert/Message nếu có lỗi trùng phòng.
- **VERIFY**: Hiển thị mượt mà không bị lỗi giao diện trên các thiết bị, form validation chống người dùng nhập sai, các Tab switch giữ/clear trạng thái rõ ràng.

## 7. Phase X: Verification (Kiểm thử)
- [ ] Check chức năng tạo 1 phòng cũ vẫn hoạt động đúng.
- [ ] Tạo nhiều phòng thành công bằng danh sách ngăn cách dấu phẩy.
- [ ] Phản hồi lỗi rõ ràng nếu điền trùng tên phòng (DB không có dư thừa).
- [ ] Chạy thành công `lint`.
- [ ] Giao diện Modal gọn gàng, không bị FOUC.
