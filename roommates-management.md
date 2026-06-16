# Kế hoạch kỹ thuật: Quản lý người ở ghép (Roommates)

## 1. Overview
Hợp đồng thuê phòng (`Contract`) hiện tại chỉ gắn với 1 `tenant_id` (Người thuê chính). Chức năng này cho phép thêm nhiều thành viên khác ở cùng phòng (Co-tenants/Roommates) vào hợp đồng đó để quản lý nhân khẩu (Tên, SĐT, CCCD) mà không làm ảnh hưởng đến luồng xuất hóa đơn thanh toán hàng tháng.

## 2. Project Type
**WEB** (Next.js, Ant Design, Supabase) - Primary Agents: `database-architect`, `backend-specialist`, `frontend-specialist`.

## 3. Database Schema
Bảng mới: `roommates`
- `id`: uuid, primary key, default gen_random_uuid()
- `org_id`: uuid, foreign key to `organizations` (bắt buộc để đảm bảo RLS)
- `contract_id`: uuid, foreign key to `contracts` (ON DELETE CASCADE)
- `full_name`: text, not null
- `phone`: text, nullable
- `id_number`: text, nullable
- `id_image_url`: text, nullable
- `created_at`: timestamptz
- `updated_at`: timestamptz

**Row Level Security (RLS):**
- Users can view/insert/update/delete roommates if `org_id` matches their user profile's `org_id`.

## 4. Backend (Server Actions)
- `getRoommatesByContract(contractId)`: Fetch danh sách người ở ghép của 1 hợp đồng.
- `createRoommate`, `updateRoommate`, `deleteRoommate`: Các hàm CRUD cơ bản.

## 5. UI/UX
- Nạp danh sách Roommates vào trang Chi tiết hợp đồng (Contract Detail) hoặc Tab "Người thuê" trong trang Chi tiết phòng (Room Detail).
- Sắp xếp UI:
  - 1 Badge "Người đại diện" (Primary Tenant - thông tin lấy từ Contract.tenant_id).
  - List các thành viên khác (Roommates) với nút "Thêm", "Sửa", "Xóa".
- Form Modal: Input (Tên, SĐT, CCCD) kèm tính năng Upload ảnh CCCD (nếu có component upload sẵn thì sử dụng, nếu không tạm nhập dạng text URL/bỏ trống).
