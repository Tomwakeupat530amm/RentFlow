# Báo cáo Phân tích & Đề xuất Chiến lược Sản phẩm: RentFlow

Dựa trên việc rà soát toàn bộ dự án hiện tại, kết hợp với các triết lý phát triển trong thư mục `workflow valid ý tưởng` (đặc biệt là chiến lược **"Đột phá có kiểm soát - Controlled Breakthrough"** và **"AI-Leveraged Execution"**) cùng với hệ thống **Agents** đang có, dưới đây là bản phân tích và đề xuất chiến lược phát triển tính năng Freemium cho RentFlow.

---

## 1. Hiện trạng Hệ thống (Current Features)
RentFlow hiện tại đã là một hệ thống SaaS hoàn chỉnh về tính năng lõi (Core Functions):
- **Core Entity:** Tòa nhà (Buildings), Phòng (Rooms - Single & Bulk), Dịch vụ (Service Prices).
- **Operation:** Khách thuê (Tenants), Người ở ghép (Roommates), Hợp đồng (Contracts).
- **Billing:** Chốt chỉ số điện nước (Meters), Lập hóa đơn (Invoices), Cập nhật thanh toán.
- **Support:** Quản lý sự cố (Incidents) dạng Kanban.
- **Analytics:** Dashboard thống kê doanh thu, tỷ lệ lấp đầy.

*Đánh giá:* Ứng dụng đã làm rất tốt phần **"Controlled"** (những tính năng truyền thống mà mọi CRM quản lý trọ phải có để hoạt động trơn tru).

---

## 2. Đề xuất Mô hình Kinh doanh: Gói Free vs Gói Premium

Áp dụng tư duy **Product Definition & Scoping**, chúng ta cần vạch ra ranh giới rõ ràng: Gói Free để thu hút (Acquisition) và kiểm chứng (Validation), Gói Premium cung cấp các **"Điểm chạm AI" (AI Intervention Points)** và **Tự động hóa sâu** để bán chéo (Monetization).

### 🟢 GÓI FREE (Cơ Bản - Miễn phí trọn đời)
**Mục tiêu:** Giúp những chủ nhà nhỏ (1-2 khu trọ) dùng thử, làm quen và lưu trữ dữ liệu an toàn.
- **Giới hạn quy mô:** Tối đa 2 Tòa nhà / 30 Phòng.
- **Tính năng mở khóa:**
  - Quản lý danh sách phòng, khách thuê, hợp đồng (Thủ công nhập tay).
  - Chốt chỉ số Điện/Nước hàng tháng (Tự điền số).
  - Xuất hóa đơn (Invoices) dạng danh sách xem trên web.
  - Dashboard báo cáo cơ bản (Doanh thu tháng hiện tại).
  - Quản lý sự cố (List view cơ bản, không có Kanban kéo thả).

### 🟡 GÓI PREMIUM (Chuyên Nghiệp - Thu phí theo tháng/năm)
**Mục tiêu:** Nhắm đến các chuỗi Căn hộ dịch vụ (CHDV), tòa nhà lớn cần tối ưu nguồn nhân sự vận hành. Áp dụng cốt lõi **"Breakthrough"** (Công nghệ / AI) vào đây.
- **Quy mô:** Không giới hạn số lượng Tòa nhà & Phòng.
- **Tính năng Đột phá (Premium Features):**
  1. **AI OCR cho Giấy tờ (AI-Leveraged):** Khi thêm Khách thuê/Người ở ghép, chủ nhà chỉ cần tải ảnh CCCD/CMND mặt trước/sau lên. AI tự động trích xuất Họ tên, SĐT, Quê quán điền sẵn vào form.
  2. **Quét Ảnh Đồng Hồ Điện/Nước (AI-Leveraged):** Thay vì gõ số thủ công dễ sai sót. Người quản lý chụp ảnh đồng hồ điện/nước, AI tự đọc số và tính tiền chênh lệch.
  3. **Auto-Payment (Webhook Ngân Hàng):** Tích hợp mã VietQR động trực tiếp vào hóa đơn. Khi người thuê chuyển khoản đúng số tiền + nội dung, hệ thống nhận Webhook từ ngân hàng và **tự động gạch nợ (Auto-paid)** mà không cần người rà soát biến động số dư.
  4. **Hợp Đồng Điện Tử (E-Signature):** Khách thuê có thể ký hợp đồng trực tiếp trên điện thoại. Chủ nhà xuất file PDF Hợp Đồng có chữ ký điện tử và gửi tự động qua email/Zalo.
  5. **Tính năng Báo cáo Nâng cao & Kanban (Advanced UX):** Sử dụng bảng Kanban kéo thả xịn xò để quản lý sự cố. Phân tích doanh thu/tồn dư theo nhiều tháng, xuất file Excel cho kế toán.
  6. **Phân quyền (RBAC - Role Based Access Control):** Cấp tài khoản phụ cho mảng Kế toán (chỉ xem tiền), hoặc Bảo vệ (chỉ xem sự kiện, sự cố).

---

## 3. Bản đồ Thực thi với Hệ thống Agent & Workflow

Để phát triển khối tính năng Premium này, chúng ra sẽ làm việc "mượt mà" bằng cách sử dụng các workflow và skill đã có:

### Bước 1: Khởi tạo Yêu cầu (Ideation -> Definition)
- **Workflow:** Chạy `product_definition_scoping.md` để khảo sát lại tập khách hàng mục tiêu xem họ sẵn sàng trả tiền cho tính năng OCR CCCD hay Auto-Payment hơn.
- **Agent Action:** Kích hoạt `@product-manager` để viết PRD (Product Requirement Document) chuẩn mực theo khung MoSCoW. Xác định xem tính năng nào là "MUST" cho bản v1.0 của gói Premium, Viết Acceptance Criteria (AC).

### Bước 2: Thiết kế Kiến trúc (Architecture)
- **Workflow:** Chạy thư mục `architecture_design.md` (Một Đập Ăn Luôn).
- **Agent Action:** Kích hoạt `@database-architect` để can thiệp vào file `database.ts`:
  - Thêm bảng `subscriptions` (quản lý gói cước của Org).
  - Thêm cột `plan_type: 'free' | 'premium'` vào bảng `organizations`.
  - Thiết kế bảng `virtual_accounts` hoặc `bank_transactions` (nếu làm Webhook).

### Bước 3: Lập kế hoạch Thực hành (Planning)
- **Agent Action:** Bàn giao lại cho `@project-planner` để chia nhỏ task ra:
  - Task 1: Dàn trang UI trang nâng cấp gói (Premium Pricing Page).
  - Task 2: Viết middleware kiểm tra quyền `plan_type` ở Backend khi truy cập tính năng VIP.
  - Task 3: Tích hợp API xử lý ảnh OCR (ví dụ: Google Cloud Vision, AWS Textract hoặc các API local).
- Sinh ra tệp `{task-slug}.md` để tracking tiến độ.

### Bước 4: Triển khai Code (Execution)
- **Frontend:** Gọi `@frontend-specialist` (tuân thủ `frontend-design` skill) để thiết kế các nút "Upgrade to Premium", trang trí nhãn hiệu ứng mượt mà.
- **Backend:** Gọi `@backend-specialist` viết các Server Actions để handle Webhook từ ngân hàng, xử lý upload hình ảnh lên Supabase Storage, và gọi hàm AI OCR phân tích.
- **Security:** Trước khi release tính năng Thanh toán (Auto-payment), gọi `@security-auditor` kiểm tra bảo mật API chống Fake Webhook theo workflow `secure_development_lifecycle.md`.

---

**Kết luận:**
Hiện tại RentFlow đã đứng vững ở khâu MVP. Tận dụng phương pháp **Controlled Breakthrough**, ta giữ cốt lõi đã có làm bản Free vững chắc, và thêm các "điểm chạm AI / Tự động hóa" làm tính năng "mồi" cho bản Premium.

Bạn muốn đào sâu rành mạch vào tính năng Premium nào trước (VD: Lên kế hoạch cho AI quét CCCD hay Thanh toán tự động)? Mình có thể gọi `@product-manager` vào việc ngay bây giờ!
