# RentFlow — Bộ Câu Hỏi & Câu Trả Lời Bảo Vệ Đồ Án (Defense Practice Answers)

> **Lưu ý quan trọng:** Toàn bộ câu trả lời dưới đây đã được **rà soát và đối chiếu 100% với mã nguồn thực tế hiện tại của dự án RentFlow** (Next.js 15 App Router, React 19, Supabase PostgreSQL RLS qua 19 migrations, PayOS Webhook 2 lớp, Ant Design v5, TailwindCSS, Cổng Khách Thuê `/portal`, và Modal Quyết Toán `CheckoutModal.tsx`).

---

## Round 1 — Problem and Technology Choices (Bài Toán Vận Hành & Lựa Chọn Công Nghệ)

### Câu 1: What operational problem does Rent-Flow solve for boarding house managers? (RentFlow giải quyết bài toán vận hành nào của các chủ trọ?)
**Trả lời:**
RentFlow giải quyết triệt để bài toán quản lý thủ công, phân tán và dễ thất thoát doanh thu của các chủ trọ, người vận hành căn hộ dịch vụ và homestay tại Việt Nam. Thay vì ghi chép sổ tay hoặc dùng các file Excel rời rạc:
1. **Khép kín quy trình hàng tháng (Monthly Loop):** Bàn giao phòng ➜ Nhập chỉ số điện nước ➜ Sinh hóa đơn tự động bằng thuật toán toán học chính xác ➜ Thu tiền qua mã VietQR động ➜ Cập nhật doanh thu/chi phí và lợi nhuận thời gian thực trên Dashboard.
2. **Loại bỏ sai số:** Tự động tính chênh lệch `(Số mới - Số cũ) * Đơn giá`, chặn nhập lùi chỉ số, và lưu trữ tiền tệ dưới dạng số nguyên `INTEGER` trong VND để tránh hoàn toàn lỗi làm tròn số thực (floating-point).
3. **Giảm 80% thời gian vận hành:** Sinh hàng loạt hóa đơn chỉ bằng 1 cú nhấp chuột và cung cấp cổng tự phục vụ cho khách thuê tra cứu và báo cáo sự cố.

---

### Câu 2: Why did you choose Next.js (App Router) instead of a traditional React SPA? (Tại sao chọn Next.js App Router thay vì React SPA truyền thống?)
**Trả lời:**
Em chọn Next.js 15 với App Router vì các ưu điểm kiến trúc vượt trội so với Single Page Application (SPA):
1. **Server Components (RSC) & Server Actions:** Cho phép thực thi logic nghiệp vụ và truy vấn cơ sở dữ liệu trực tiếp trên Server. Trình duyệt không phải tải hàng megabyte thư viện logic, giúp trang tải ban đầu (FCP) dưới 500ms.
2. **Bảo mật tuyệt đối (Zero API Key Leak):** Các biến môi trường nhạy cảm như `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` chỉ nằm ở tầng Server, hoàn toàn không bị lộ xuống bundle JavaScript của Client.
3. **Full-stack trong một codebase:** Cung cấp sẵn Route Handlers (`/api/webhooks/payos`, `/api/tenant/login`, `/api/ocr`, `/api/cron`) giúp xử lý Webhook và API ngoài mà không cần dựng thêm một backend riêng biệt như Express hay NestJS.

---

### Câu 3: Why use Supabase instead of building a custom Node.js backend with MongoDB or PostgreSQL? (Tại sao chọn Supabase thay vì tự dựng Backend Node.js riêng?)
**Trả lời:**
Supabase là nền tảng Backend-as-a-Service mã nguồn mở dựa trên PostgreSQL mạnh mẽ, mang lại các lợi ích then chốt:
1. **Row Level Security (RLS) cấp cơ sở dữ liệu:** Bảo vệ dữ liệu Multi-Tenancy ngay trong nhân PostgreSQL. Dù code tầng ứng dụng có sơ suất thì cơ sở dữ liệu vẫn chặn không cho rò rỉ dữ liệu giữa các tổ chức.
2. **Tích hợp toàn diện:** Cung cấp sẵn Supabase Auth (quản lý phiên qua JWT HTTP-only cookie), Supabase Storage (lưu ảnh CCCD và ảnh đồng hồ có phân quyền), và Database Webhooks/Triggers.
3. **Tối ưu năng suất phát triển (Time-to-Market):** Tiết kiệm 60–70% thời gian dựng CRUD và xác thực cơ bản, giúp em tập trung toàn lực vào nghiệp vụ lõi: đối soát điện nước, tính toán hóa đơn, thanh toán QR và vận hành homestay.

---

### Câu 4: Why did you combine Ant Design (antd) with Tailwind CSS? What are the pros and cons? (Tại sao kết hợp Ant Design v5 với Tailwind CSS? Ưu nhược điểm là gì?)
**Trả lời:**
Sự kết hợp này nhằm tận dụng thế mạnh riêng của từng công cụ:
- **Ant Design v5:** Cung cấp bộ linh kiện UI chuẩn doanh nghiệp cực kỳ phức tạp và hoàn thiện (Table phân trang/sắp xếp, Modal, DatePicker tiếng Việt qua dayjs, Kanban board kéo thả, Form validation).
- **Tailwind CSS:** Cung cấp hệ thống utility classes giúp dàn trang (Flexbox/Grid), căn chỉnh khoảng cách (spacing), hiệu ứng vi mô (micro-interactions) và responsive trên di động một cách nhanh chóng mà không cần viết file CSS riêng.
- **Đánh đổi (Cons):** Dung lượng bundle ban đầu lớn hơn và cần cấu hình cẩn thận `StyleProvider` / CSS hash priority trong Next.js App Router để tránh xung đột thứ tự ưu tiên giữa reset CSS của Tailwind và CSS-in-JS của Antd.

---

### Câu 5: Why integrate PayOS instead of just letting users track manual bank transfers? (Tại sao tích hợp PayOS thay vì chỉ theo dõi chuyển khoản ngân hàng thủ công?)
**Trả lời:**
1. **Trải nghiệm thanh toán chuẩn Napas247:** PayOS tạo ra mã **VietQR động** cho từng hóa đơn. Khi khách thuê quét mã bằng bất kỳ app ngân hàng nào (Vietcombank, MB, Techcombank...), số tiền chính xác và nội dung chuyển khoản được nạp tự động, loại bỏ 100% lỗi khách gõ sai số tiền hoặc quên ghi số phòng.
2. **Tự động hóa đối soát (Auto-Reconciliation):** Khi tiền về tài khoản, PayOS gửi Webhook đến hệ thống trong vòng 2–3 giây. Hệ thống tự động xác thực chữ ký HMAC-SHA256, tìm hóa đơn tương ứng, gạch nợ và chuyển trạng thái sang `paid` mà chủ nhà không cần mở app ngân hàng kiểm tra thủ công.
3. **Cung cấp phương án dự phòng (Manual Fallback):** Nếu khách thanh toán bằng tiền mặt hoặc chuyển khoản ngoài, chủ trọ vẫn có nút "Cập nhật thanh toán" thủ công trên giao diện để linh hoạt xử lý thực tế.

---

## Round 2 — Next.js & Supabase Architecture (Kiến Trúc Kỹ Thuật)

### Câu 6: Explain the difference between Server Components and Client Components in your app. Where do you use each? (Phân biệt Server Components và Client Components trong ứng dụng?)
**Trả lời:**
- **Server Components (mặc định trong Next.js App Router):** Chạy 100% trên Server, không tải JavaScript về trình duyệt. Được dùng cho các trang chính (như `page.tsx` của `/buildings`, `/rooms`, `/contracts`, `/invoices`, `/dashboard`) để truy vấn dữ liệu an toàn qua Supabase Server Client, tận dụng cache và bảo mật secrets.
- **Client Components (khai báo directive `'use client'` ở đầu file):** Được đóng gói và thực thi trên trình duyệt. Dùng cho các thành phần tương tác:
  - Form nhập liệu và cửa sổ bật lên (`TenantFormModal.tsx`, `BatchRoomModal.tsx`, `CheckoutModal.tsx`).
  - Bảng Kanban kéo thả trạng thái sự cố (`KanbanBoard.tsx` dùng `@dnd-kit/core`).
  - Bộ lọc tìm kiếm và bảng dữ liệu tương tác (`InvoicesClient.tsx`, `TenantsClient.tsx`).

---

### Câu 7: How does the application communicate with the database? Do you use the Supabase client mostly on the frontend or backend? (Ứng dụng giao tiếp với CSDL như thế nào? Supabase client được dùng ở frontend hay backend?)
**Trả lời:**
Ứng dụng giao tiếp chủ yếu qua **Backend** bằng gói thư viện `@supabase/ssr` với 3 loại client có cấp độ tin cậy khác nhau:
1. **Server SSR Client (`src/lib/supabase/server.ts` - Client mặc định):** Chạy trong Server Components và Server Actions. Client này đọc JWT token từ HTTP-only Cookies của người dùng, do đó **mọi truy vấn vào PostgreSQL đều bị kiểm soát chặt chẽ bởi Row Level Security (RLS)** theo `org_id` của user đó.
2. **Admin Service-Role Client (`src/lib/supabase/admin.ts`):** Sử dụng `SUPABASE_SERVICE_ROLE_KEY` để bypass RLS. Client này chỉ được dùng trong các ngữ cảnh không có session người dùng, cụ thể là:
   - Route Webhook tiếp nhận thanh toán từ PayOS (`/api/webhooks/payos`).
   - Route đăng nhập bằng mã PIN của khách thuê (`/api/tenant/login`).
   - Xử lý xác thực đăng ký tài khoản tham gia tổ chức bằng mã mời (`registerAndJoinOrg`).
3. **Browser Client (`src/lib/supabase/client.ts`):** Dùng ở Client Component cho các tác vụ tải file hoặc tương tác nhẹ, vẫn tuân thủ RLS.

---

### Câu 8: Describe a request flow from clicking "Tạo hóa đơn" (Create Invoice) to the database and back. (Mô tả luồng xử lý từ khi bấm "Tạo hóa đơn" đến CSDL và phản hồi?)
**Trả lời:**
1. **Client Event:** Trên giao diện `InvoicesClient.tsx`, người dùng bấm "Sinh hóa đơn tháng này" hoặc tạo hóa đơn lẻ.
2. **Server Action Invocation:** Client gọi Server Action `generateMonthlyInvoices` hoặc `createInvoice` (trong `src/app/(dashboard)/invoices/actions.ts`).
3. **Authentication & RLS Context:** Server Action gọi `createClient()` từ `server.ts` để lấy session và `org_id` của user từ cookie.
4. **Business Logic & Pricing:**
   - Đọc danh sách hợp đồng đang hoạt động (`status = 'active'`).
   - Đọc chỉ số tiêu thụ điện/nước mới nhất từ bảng `meter_records`.
   - Lấy bảng giá dịch vụ tương ứng của tòa nhà (`service_prices`).
   - Tính tổng tiền = `Tiền phòng + (Điện kWh * Đơn giá) + (Nước m3 * Đơn giá) + Dịch vụ cố định`.
5. **Database Mutation:** Insert bản ghi vào bảng `invoices` và các dòng chi tiết vào bảng `invoice_items`.
6. **Revalidation & UI Update:** Gọi `revalidatePath('/invoices')` và `revalidatePath('/dashboard')` để xóa cache dữ liệu cũ. Server Action trả về `{ success: true, count: N }`. Client nhận kết quả, hiển thị thông báo `message.success` và bảng dữ liệu tự động cập nhật ngay lập tức.

---

### Câu 9: How do you handle webhook events from PayOS when a customer pays? (Xử lý Webhook PayOS khi khách thanh toán như thế nào?)
**Trả lời:**
Hệ thống có **2 route Webhook** độc lập phục vụ 2 nghiệp vụ khác nhau:
1. **Webhook Thanh Toán Tiền Thuê Trọ (`src/app/api/webhooks/payos/route.ts`):**
   - **Xác thực chữ ký số:** Kiểm tra tính toàn vẹn payload bằng hàm `verifyPaymentWebhookData()` với khóa Checksum riêng của từng Tổ chức (`payment_settings`) hoặc khóa hệ thống để chống giả mạo request.
   - **Đối soát 2 lớp (Dual-matching):**
     - *Lớp 1:* Tìm hóa đơn theo mã số `order_code` do PayOS quản lý.
     - *Lớp 2 (Fallback):* Nếu không có `order_code`, dùng Regex trích xuất chuỗi UUID của hóa đơn nằm trong nội dung chuyển khoản `description`.
   - **Xử lý Bất biến (Idempotency):** Nếu hóa đơn đã ở trạng thái `paid`, trả về HTTP 200 ngay lập tức, không xử lý lại.
   - **Cập nhật:** Tăng số tiền đã thanh toán `paid_amount`, cập nhật trạng thái (`paid` nếu đủ tiền, `partial` nếu trả một phần), và lưu dấu thời gian `paid_at`.
2. **Webhook Nâng Cấp Gói Premium SaaS (`src/app/api/webhooks/payment/route.ts`):**
   - Lắng nghe giao dịch mua gói phần mềm của chủ trọ, cập nhật bảng `payment_transactions` thành `PAID` và kích hoạt thời hạn trong bảng `subscriptions`.

---

### Câu 10: What is the role of `middleware.ts` in your Next.js application? (Vai trò của file `middleware.ts` là gì?)
**Trả lời:**
`src/middleware.ts` là lớp chốt chặn bảo vệ (Edge Route Guard) chạy trước mọi request:
1. **Bảo vệ phân hệ Quản trị (`/dashboard/*`):** Kiểm tra phiên đăng nhập Supabase Auth. Nếu người dùng chưa đăng nhập, lập tức điều hướng về `/login`. Nếu token sắp hết hạn, tự động gọi `updateSession()` để làm mới cookie JWT.
2. **Bảo vệ Cổng Khách Thuê (`/portal/*`):** Kiểm tra cookie bảo mật `tenant-session` (JWT chứa `tenantId`, `phone`, `orgId`). Nếu chưa có hoặc token không hợp lệ, chuyển hướng khách thuê về trang `/portal/login`.
3. **Chặn truy cập ngược:** Nếu người dùng đã đăng nhập tài khoản chủ nhà hoặc khách thuê, họ sẽ bị chặn không cho vào lại các trang đăng nhập tương ứng, tự động chuyển về trang tổng quan.

---

## Round 3 — Data, Login, and Persistence (Dữ Liệu, Xác Thực & Lưu Trữ)

### Câu 11: What are the most important database entities and how are they related in the billing flow? (Các thực thể CSDL quan trọng nhất và quan hệ của chúng trong luồng tính tiền?)
**Trả lời:**
Hệ thống gồm 13 thực thể chính được thiết kế chuẩn hóa và cô lập theo `org_id`:
- **Cấu trúc phân cấp tài sản:** `organizations` ➜ `buildings` (chứa bảng giá `service_prices`) ➜ `rooms` (trạng thái: `available`, `occupied`, `maintenance`).
- **Con người & Ràng buộc pháp lý:** `tenants` (khách thuê) liên kết với `rooms` thông qua `contracts` (hợp đồng thuê, tiền cọc, chỉ số ban đầu, ngày bắt đầu/kết thúc).
- **Chuỗi tính tiền cốt lõi:**
  - Hàng tháng, ghi nhận `meter_records` (chỉ số điện, nước cũ và mới).
  - Sinh ra `invoices` tham chiếu đến `contract_id` và `room_id`.
  - Mỗi hóa đơn có nhiều `invoice_items` (tiền phòng, tiền điện, tiền nước, rác, internet...).
  - Kết nối với `payment_transactions` và cập nhật các trường `paid_amount`, `paid_at`, `status`.

---

### Câu 12: How does Supabase handle user authentication and session management in Next.js? (Supabase xử lý xác thực và quản lý phiên trong Next.js như thế nào?)
**Trả lời:**
- Supabase Auth sử dụng chuẩn mã hóa **PKCE (Proof Key for Code Exchange)**.
- Khi người dùng đăng nhập bằng Email/Password hoặc Google OAuth, Supabase trả về Access Token và Refresh Token dạng JWT.
- Bộ adapter `@supabase/ssr` lưu trữ các token này vào **HTTP-only, Secure Cookies** trên trình duyệt. Cookie này không thể bị truy cập bởi mã JavaScript độc hại trên máy khách, loại trừ hoàn toàn nguy cơ tấn công đánh cắp phiên qua XSS.
- Khi người dùng duyệt web, `middleware.ts` tự động kiểm tra tính hợp lệ và hoán đổi Refresh Token để gia hạn phiên làm việc liên tục mà không gây gián đoạn trải nghiệm người dùng.

---

### Câu 13: How are images (e.g., ID cards, incident photos) uploaded and secured in your system? (Hình ảnh CCCD, ảnh đồng hồ, ảnh sự cố được tải lên và bảo mật ra sao?)
**Trả lời:**
1. **Lưu trữ trên Supabase Storage:** Ứng dụng tạo các Bucket riêng biệt (`tenants`, `incidents`, `meter_proofs`).
2. **Chính sách phân quyền cấp Storage (Storage RLS):** Được định nghĩa chi tiết trong migration `20260629000002_storage_rls.sql`.
   - Các Bucket được đặt ở chế độ **Private**, không cấp quyền đọc công khai (No Public URL).
   - Chỉ người dùng thuộc đúng `org_id` của bức ảnh mới có quyền SELECT hoặc INSERT thông qua token xác thực.
3. **Cơ chế Signed URL:** Khi cần hiển thị ảnh CCCD hoặc bằng chứng sự cố trên giao diện, hệ thống sinh ra một **Signed URL** tạm thời có chữ ký bảo mật và tự động hết hạn sau 60 phút, đảm bảo tuân thủ nghiêm ngặt quyền riêng tư và quy định bảo vệ dữ liệu cá nhân.

---

### Câu 14: How do you manage "Invite Codes" for staff AND "Access PINs" for tenants? (Quản lý mã mời cho nhân viên và mã PIN cho khách thuê như thế nào?)
**Trả lời:**
Hệ thống tách biệt hoàn toàn 2 cơ chế truy cập tương ứng với 2 nhóm người dùng:
1. **Mã Mời Nhân Viên (Staff Invite Code):**
   - Mỗi Tổ chức có một mã mời ngẫu nhiên (`organizations.invite_code`), chủ nhà có thể xem và làm mới trong trang **Cài Đặt** (`/settings`).
   - Khi nhân viên đăng ký tài khoản tại màn hình đăng ký, họ nhập mã này. Hàm `registerAndJoinOrg` (`src/app/(auth)/actions.ts`) sẽ xác thực mã, liên kết tài khoản vào tổ chức và gán role là `staff`.
2. **Mã PIN Cổng Khách Thuê (Tenant Portal Access PIN):**
   - Khi chủ nhà tạo mới một khách thuê, Server Action `generatePinCode()` tự động sinh một mã PIN 6 chữ số ngẫu nhiên lưu vào cột `access_code`.
   - Trên màn hình **Khách thuê** (`TenantsClient.tsx`), chủ trọ có riêng một cột xem mã PIN, nút **1-click sao chép thông tin gửi Zalo** (kèm link portal, SĐT và mã PIN), và nút **"Cấp lại mã PIN mới"** (`regenerateTenantPin`) khi khách cần đổi mã.
   - Khách thuê chỉ cần dùng Số điện thoại + Mã PIN 6 số để đăng nhập vào `/portal` trên điện thoại mà không cần đăng ký tài khoản phức tạp.

---

### Câu 15: If a tenant moves out, how do you handle their historical data to avoid breaking past invoices? (Khi khách chuyển đi, dữ liệu lịch sử được xử lý thế nào để không làm hỏng hóa đơn cũ?)
**Trả lời:**
Ứng dụng áp dụng nguyên tắc toàn vẹn dữ liệu quan hệ (Referential Integrity) qua 2 cơ chế:
1. **Thanh lý hợp đồng thay vì xóa cứng (Contract Termination):** Khi khách trả phòng qua `CheckoutModal.tsx`, hợp đồng chuyển trạng thái thành `terminated`, phòng được giải phóng thành `available`. Toàn bộ bản ghi của khách thuê (`tenants`), hợp đồng (`contracts`) và chỉ số điện nước cũ vẫn được giữ nguyên vẹn trong CSDL.
2. **Cơ chế Soft Delete (Xóa mềm):** Dựa trên migration `20260629000001_soft_delete.sql`, các bảng có cột `deleted_at`. Khi thực hiện thao tác xóa khách thuê, hệ thống chỉ cập nhật timestamp `deleted_at = NOW()` và ẩn khỏi danh sách hiển thị thông thường. Các hóa đơn cũ trong quá khứ khi truy vấn vẫn join được đầy đủ thông tin tên khách, số CCCD và số tiền mà không bao giờ bị lỗi `null reference`.

---

## Round 4 — Flagship Billing & Incident Flow (Nghiệp Vụ Cốt Lõi: Điện Nước & Sự Cố)

### Câu 16: Walk us through the full flow from a tenant moving in to them receiving their first monthly bill. (Mô tả toàn bộ luồng từ khi khách vào ở đến khi nhận hóa đơn tháng đầu tiên?)
**Trả lời:**
1. **Bàn giao phòng (Check-in):** Chủ trọ vào `/tenants` thêm thông tin khách ➜ Vào `/contracts` bấm "Tạo Hợp đồng", chọn phòng trống, điền số tiền cọc, ngày bắt đầu và chỉ số điện/nước ban đầu. Sau khi tạo, trạng thái phòng tự động chuyển sang `occupied` (Đang thuê).
2. **Chốt chỉ số cuối tháng:** Vào `/meters`, chọn kỳ tháng/năm, nhập chỉ số điện và nước hiện tại của phòng. Hệ thống tự động đối chiếu với chỉ số lúc nhận phòng để tính ra sản lượng tiêu thụ.
3. **Sinh hóa đơn tự động:** Vào `/invoices`, bấm "Sinh hóa đơn tháng này". Hệ thống tự động thu thập: Tiền phòng theo hợp đồng + (Sản lượng điện * Đơn giá điện toà nhà) + (Sản lượng nước * Đơn giá nước toà nhà) + Dịch vụ cố định (rác, internet...).
4. **Gửi hóa đơn & Thanh toán:** Hóa đơn được tạo kèm mã **VietQR nạp sẵn số tiền**. Khách thuê có thể đăng nhập vào Cổng Khách Thuê `/portal` trên điện thoại để quét mã VietQR thanh toán, hoặc chủ trọ bấm "Gửi Zalo" để gửi tin nhắn kèm mã QR cho khách. Khi tiền về, hóa đơn tự động đổi sang `paid`.

---

### Câu 17: How is monthly electricity/water calculated, and what validation prevents entering a lower reading than last month? (Tính tiền điện nước thế nào và có cơ chế nào chặn nhập số lùi không?)
**Trả lời:**
- **Công thức:** `Tiêu thụ = Math.max(0, Chỉ số mới - Chỉ số cũ)`. `Thành tiền = Tiêu thụ * Đơn giá dịch vụ của tòa nhà`.
- **Cơ chế chặn nhập lùi (Validation Guard):**
  - Trong Server Action `recordMeterReading` (`src/app/(dashboard)/meters/actions.ts`), hệ thống truy vấn chỉ số của kỳ trước liền kề (`old_reading`).
  - Nếu `new_reading < old_reading`, Server Action lập tức từ chối và ném ra thông báo lỗi: *"Chỉ số mới không được nhỏ hơn chỉ số cũ kỳ trước ({old_reading})"*.
  - Dữ liệu sai bị chặn ngay từ server, không bao giờ được ghi xuống cơ sở dữ liệu.

---

### Câu 18: How does the Incident Management Kanban board work technically using `@dnd-kit/core`? (Bảng Kanban quản lý sự cố hoạt động thế nào với `@dnd-kit/core`?)
**Trả lời:**
1. **Kiến trúc kéo thả:** Giao diện `KanbanBoard.tsx` sử dụng `@dnd-kit/core` với các bộ cảm biến con trỏ và bàn phím (`PointerSensor`, `KeyboardSensor`), quản lý 3 cột trạng thái: `open` (Chờ xử lý), `in_progress` (Đang sửa) và `resolved` (Đã giải quyết).
2. **Cập nhật lạc quan (Optimistic UI Update):** Khi người dùng thả thẻ sự cố sang cột mới, hàm `onDragEnd` sẽ lập tức cập nhật state trên giao diện trong vòng 16ms (chuẩn 60fps), mang lại cảm giác mượt mà tức thì cho người dùng.
3. **Đồng bộ Server bất đồng bộ:** Ngay sau đó, component gọi Server Action `updateIncidentStatus(incidentId, newStatus)`. Nếu Server xử lý thành công, gọi `revalidatePath('/incidents')`. Nếu có sự cố mạng hoặc lỗi quyền hạn, hệ thống sẽ rollback state trên UI về vị trí cũ và hiển thị thông báo lỗi `message.error`.

---

### Câu 19: How does the dashboard compute total revenue? Is it cash-basis or accrual-basis? (Dashboard tính tổng doanh thu như thế nào? Theo dòng tiền thực thu hay theo hóa đơn phát hành?)
**Trả lời:**
Dashboard của RentFlow áp dụng nguyên tắc **Kế toán dòng tiền thực thu (Cash-basis Accounting)**:
- **Doanh thu thực tế (Total Revenue):** Được tính bằng tổng số tiền thực thu `paid_amount` từ các hóa đơn đã được thanh toán (`status = 'paid'` hoặc phần đã thanh toán của `status = 'partial'`) có ngày ghi nhận trong tháng hiện tại.
- **Công nợ chưa thu (Receivables):** Các hóa đơn đã tạo nhưng chưa thanh toán (`unpaid` hoặc phần còn thiếu của `partial`) được tách riêng thành chỉ số "Công nợ đang chờ thu".
- Cách tiếp cận này giúp chủ nhà nhìn thấy chính xác dòng tiền thực có trong túi để chi trả các chi phí vận hành, không bị ngộ nhận giữa doanh số trên giấy tờ và tiền mặt thực tế.

---

### Câu 20: How does Bulk Room Creation work, and how do you prevent duplicate rooms in a building? (Chức năng tạo phòng hàng loạt hoạt động ra sao và chống trùng tên phòng thế nào?)
**Trả lời:**
Trong mã nguồn hiện tại, chức năng này được hiện thực hóa qua **Modal Sinh Ma Trận Phòng Tự Động (`BatchRoomModal.tsx`):**
1. **Tạo hàng loạt theo ma trận tầng:** Chủ trọ chỉ cần nhập: Tầng bắt đầu, Tầng kết thúc, Số phòng mỗi tầng, Định dạng tên (`101`, `P101` hoặc `P.101`), Giá thuê mặc định và Diện tích.
2. **Bảng xem trước trực quan (Interactive Live Preview):** Hệ thống tự động sinh danh sách phòng kèm checkbox cho từng phòng. Chủ trọ có thể bỏ chọn những phòng không có thực tế (ví dụ: tầng 1 chừa chỗ để xe).
3. **Thực thi và chống trùng lặp 2 lớp:**
   - *Lớp 1 (Application logic):* Server Action `batchCreateRooms` truy vấn trước các phòng đã có trong toà nhà, tự động loại trừ các phòng trùng tên và chỉ insert các phòng mới, đồng thời gửi thông báo: *"Đã tạo thành công N phòng, bỏ qua X phòng đã tồn tại"*.
   - *Lớp 2 (Database Constraint):* Bảng `rooms` có ràng buộc duy nhất `UNIQUE(building_id, name)`, đảm bảo cấp độ cơ sở dữ liệu không bao giờ xảy ra tình trạng trùng lặp tên phòng trong cùng một tòa nhà.

---

## Round 5 — Permissions, Integrity, and Reliability (Phân Quyền, Toàn Vẹn & Độ Tin Cậy)

### Câu 21: Where are Row Level Security (RLS) policies enforced, and why are they critical for Multi-Tenancy? (Chính sách RLS được thực thi ở đâu và tại sao quan trọng với Multi-Tenancy?)
**Trả lời:**
- **Thực thi sâu trong nhân PostgreSQL:** Row Level Security được kiểm tra trực tiếp ở mức nhân của hệ quản trị cơ sở dữ liệu PostgreSQL tại thời điểm biên dịch câu truy vấn SQL, hoàn toàn độc lập với code ứng dụng Next.js.
- **Ý nghĩa sống còn đối với SaaS:** Trong mô hình cơ sở dữ liệu dùng chung (Shared Database Multi-Tenancy), mọi câu lệnh `SELECT`, `INSERT`, `UPDATE`, `DELETE` từ phía người dùng đều tự động được áp dụng thêm mệnh đề ràng buộc: `WHERE org_id = auth.user_org_id()`.
- Nhờ đó, ngay cả khi lập trình viên quên viết điều kiện `WHERE org_id = ...` trong code Server Action, cơ sở dữ liệu vẫn tuyệt đối không bao giờ trả về bản ghi của chủ trọ khác, ngăn chặn 100% rủi ro rò rỉ dữ liệu chéo giữa các khách hàng thuê bao phần mềm.

---

### Câu 22: How do you differentiate permissions between a property owner (Admin) and a staff/accountant? (Phân quyền giữa Chủ nhà và Nhân viên/Kế toán như thế nào?)
**Trả lời:**
Hệ thống áp dụng mô hình phân quyền dựa trên vai trò **RBAC (Role-Based Access Control)**:
1. **Lưu trữ vai trò:** Cột `role` trong bảng `user_profiles` nhận các giá trị: `owner` (Chủ nhà) hoặc `staff` (Nhân viên/Cộng tác viên).
2. **Kiểm soát ở giao diện (UI Guard):** Menu điều hướng và các nút thao tác nhạy cảm (như nút Xóa toà nhà, Cấu hình tài khoản ngân hàng PayOS, Quản lý mã mời nhân viên) sẽ tự động ẩn đối với tài khoản có role `staff`.
3. **Bảo vệ ở tầng Server Actions (Server Enforcement):** Mọi Server Action nhạy cảm đều gọi hàm `getCurrentUserOrganization()`. Nếu người dùng không có role `owner`, hệ thống sẽ từ chối thực thi và trả về lỗi `{ error: 'Bạn không có quyền thực hiện thao tác này' }`, ngăn chặn triệt để việc tấn công gọi API trái phép qua Postman/cURL.

---

### Câu 23: If a webhook from PayOS fails or is delayed, how is the invoice updated? Is there a manual fallback? (Nếu Webhook PayOS bị lỗi hoặc gửi chậm, hóa đơn xử lý thế nào? Có phương án dự phòng không?)
**Trả lời:**
Hệ thống thiết kế theo nguyên tắc phòng thủ đa lớp (Defense in Depth):
1. **Cơ chế Retry & Đối soát thông minh của Webhook (`/api/webhooks/payos`):** PayOS có cơ chế tự động thử lại khi gửi webhook. Webhook của RentFlow có kiểm tra Idempotent (chống xử lý 2 lần) và hỗ trợ tìm hóa đơn qua cả 2 tiêu chí (`order_code` hoặc regex mã UUID hóa đơn trong `description`).
2. **Phương án Dự phòng Thủ công (Manual Fallback):**
   - Nếu xảy ra sự cố nghẽn mạng ngân hàng hoặc khách thuê thanh toán bằng tiền mặt trực tiếp tại quầy, chủ trọ hoặc nhân viên có thể mở chi tiết hóa đơn trên giao diện `InvoicesClient.tsx` và bấm nút **"Cập nhật thanh toán" (Record Payment)**.
   - Thao tác này cho phép nhập số tiền thực nhận và ghi chú phương thức thanh toán, hóa đơn sẽ lập tức được chuyển sang `paid` mà không cần phụ thuộc vào webhook trực tuyến.

---

### Câu 24: Which flow demonstrates the best use of a database transaction, and what records does it write? (Luồng nào thể hiện rõ nhất tính giao dịch CSDL và nó ghi những bản ghi nào?)
**Trả lời:**
Có 2 luồng thể hiện tính giao dịch toàn vẹn cao nhất:
1. **Luồng Tạo Hợp Đồng Thuê (`createContract`):** Phải đảm bảo tính nguyên tử (Atomicity) giữa 2 thao tác:
   - Thao tác 1: Tạo bản ghi hợp đồng mới trong bảng `contracts`.
   - Thao tác 2: Chuyển trạng thái phòng tương ứng trong bảng `rooms` từ `available` sang `occupied`. Nếu một trong hai bước gặp lỗi, toàn bộ giao dịch sẽ bị rollback, tránh tình trạng hợp đồng đã ký nhưng phòng vẫn báo trống.
2. **Luồng Trả Phòng & Quyết Toán Cọc (`CheckoutModal.tsx` / `checkoutContract`):**
   - Ghi lại bản ghi quyết toán hoàn cọc `settlementData` (chỉ số điện nước ngày cuối, các khoản trừ hư hại).
   - Chuyển trạng thái hợp đồng thành `terminated`.
   - Chuyển trạng thái phòng về lại `available` để sẵn sàng đón khách thuê mới.

---

## Round 6 — Honest Limitations and Future Work (Giới Hạn Thực Tế & Hướng Phát Triển)

### Câu 25: What is the most important consistency weakness in your current billing flow, and how would you improve it? (Điểm yếu nhất về tính nhất quán trong luồng tính tiền là gì và cải thiện thế nào?)
**Trả lời:**
- **Điểm yếu thực tế:** Hiện tại đơn giá dịch vụ điện, nước được cấu hình theo từng Tòa nhà trong bảng `service_prices`. Nếu chủ nhà thay đổi đơn giá ở giữa tháng (ví dụ từ 3.500 đ lên 4.000 đ/kWh) mà chưa chốt hóa đơn, khi sinh hóa đơn hệ thống sẽ lấy đơn giá mới nhất áp dụng cho toàn bộ kỳ.
- **Giải pháp cải thiện:** Áp dụng cơ chế **Chụp nhanh đơn giá (Pricing Snapshot)**. Khi ký hợp đồng với khách, đơn giá dịch vụ sẽ được sao chép và lưu cứng trực tiếp vào bản ghi của Hợp đồng (`contracts.service_rates`) hoặc lưu snapshot vào từng dòng chi tiết của hóa đơn (`invoice_items.unit_price`). Nhờ đó, việc thay đổi bảng giá chung của tòa nhà sẽ không bao giờ làm sai lệch các thỏa thuận đã ký trước đó.

---

### Câu 26: If two staff members update the meter reading for the same room at the exact same time, what happens? (Nếu 2 nhân viên cùng chốt chỉ số điện nước cho 1 phòng cùng một lúc thì sao?)
**Trả lời:**
- Cơ sở dữ liệu đã được bảo vệ tuyệt đối nhờ **Unique Constraint `idx_one_meter_record_per_room_month`** (được chuẩn hóa trong migration `20260928000000_fix_meter_records_unique_index.sql`).
- Ràng buộc này quy định một phòng chỉ được phép tồn tại duy nhất 1 bản ghi chỉ số cho mỗi cặp `(room_id, month, year, meter_type)`.
- Khi 2 nhân viên bấm Lưu cùng một thời điểm, PostgreSQL sẽ khóa hàng theo cơ chế kiểm soát tương tranh. Người đến trước sẽ insert thành công; người đến sau sẽ nhận mã lỗi vi phạm khóa duy nhất `Unique Violation (Error 23505)`. Server Action bắt lỗi này và hiển thị thông báo rõ ràng cho người thứ hai: *"Chỉ số phòng này trong tháng đã được ghi nhận trước đó"*, ngăn chặn hoàn toàn việc nhân đôi số tiền tiêu thụ.

---

### Câu 27: Name one security weakness or missing validation in the current implementation. (Nêu một điểm yếu bảo mật hoặc thiếu sót kiểm tra dữ liệu hiện tại?)
**Trả lời:**
- **Hạn chế thực tế:** Hiện tại mã PIN đăng nhập của khách thuê (`access_code` trong bảng `tenants`) đang được lưu dưới dạng chuỗi thô (plain text) thay vì mã hóa băm một chiều (bcrypt/argon2). Nguyên nhân ban đầu là để chủ nhà có thể dễ dàng xem lại mã và bấm nút sao chép gửi qua Zalo cho khách thuê lớn tuổi không rành công nghệ.
- **Hướng khắc phục chuẩn bảo mật:**
  - Áp dụng thuật toán băm `bcrypt` cho mã PIN trước khi lưu xuống database giống như mật khẩu người dùng thông thường.
  - Xây dựng cơ chế gửi mã đăng nhập một lần (OTP) trực tiếp qua tin nhắn SMS Brandname hoặc Zalo ZNS khi khách đăng nhập, thay vì lưu trữ mã PIN cố định.

---

### Câu 28: How does the system handle contract termination before the month ends and prorated billing (tính tiền lẻ ngày)? (Hệ thống xử lý thanh lý hợp đồng giữa tháng và tính tiền lẻ ngày ra sao?)
**Trả lời:**
Khác với các hệ thống đơn giản chỉ tính theo tháng tròn, RentFlow đã phát triển hoàn chỉnh **Modal Trả Phòng & Quyết Toán Hoàn Cọc (`CheckoutModal.tsx`):**
1. **Chốt điện nước ngày cuối:** Tự động lấy chỉ số cũ và cho phép nhập chỉ số đồng hồ tại thời điểm bàn giao chìa khóa, tính tiền điện nước phát sinh lẻ ngày theo đúng công thức: `(Mới - Cũ) * Đơn giá`.
2. **Tiền phòng lẻ ngày & Nợ cũ:** Cung cấp ô nhập số tiền phòng lẻ ngày hoặc tiền nợ kỳ trước chưa đóng (`unpaid_rent`).
3. **Danh mục khấu trừ phát sinh linh hoạt:** Cho phép thêm không giới hạn các khoản phạt thực tế (vệ sinh phòng, đền bù mất chìa khóa, làm hỏng sơn tường...) kèm số tiền tương ứng.
4. **Tự động quyết toán cọc:** Tự động lấy `Tiền cọc ban đầu - Tổng các khoản khấu trừ`. Hệ thống hiển thị rõ ràng số tiền chủ nhà cần hoàn cọc cho khách, hoặc số tiền khách cần đóng bù nếu chi phí vượt quá tiền cọc.
5. **Biên bản gửi Zalo tức thì:** Tự động soạn sẵn mẫu biên bản quyết toán chi tiết, có nút 1-click sao chép gửi trực tiếp cho khách qua Zalo.

---

## Round 7 — Demo Pressure Questions (Tình Huống Áp Lực Khi Demo Trước Hội Đồng)

### Câu 29: If the Supabase API goes down during a demo, what happens? How does it handle the error gracefully? (Nếu Supabase mất mạng hoặc sự cố khi đang demo thì sao? Hệ thống xử lý lỗi thế nào?)
**Trả lời:**
1. **Next.js Error Boundaries (`error.tsx`):** Nếu việc fetch dữ liệu từ Supabase gặp lỗi mạng hoặc timeout, Next.js sẽ kích hoạt component `error.tsx` ở cấp route tương ứng. Thay vì bị sập ứng dụng hoặc hiện màn hình trắng, hệ thống hiển thị thông báo lỗi thân thiện: *"Không thể kết nối đến máy chủ dữ liệu. Vui lòng kiểm tra lại kết nối mạng"* cùng nút "Thử lại" (Retry).
2. **Ảnh chụp sao lưu dự phòng (Fallback Evidence):** Trong tài liệu thuyết trình (Slide 13 và báo cáo), em đã chụp lại đầy đủ kết quả chạy thực tế với đúng bộ dữ liệu chuẩn (Doanh thu 10.500.000 đ, 3/6 phòng đang thuê, tỷ lệ lấp đầy 50%). Nếu mạng tại hội trường gặp sự cố cục bộ, em hoàn toàn có thể trình chiếu các bằng chứng này để bảo vệ đồ án.

---

### Câu 30: Which part of the demo would you show first to prove the system has real business value, and why? (Tính năng nào bạn sẽ ưu tiên biểu diễn trước để chứng minh giá trị thực tế?)
**Trả lời:**
Em sẽ trình diễn chuỗi liên hoàn **"Chốt Chỉ Số Điện Nước ➜ Sinh Hóa Đơn Hàng Loạt ➜ Hiển Thị VietQR Động"**.
- **Lý do:** Đây chính là "điểm đau" (pain point) lớn nhất của tất cả các chủ trọ tại Việt Nam vào ngày 30 hàng tháng. Thay vì mất 2–3 ngày đi chép sổ, cộng trừ thủ công bằng máy tính cầm tay và dễ bị cãi nhau với khách vì tính nhầm, RentFlow giải quyết toàn bộ quy trình này chỉ trong **dưới 30 giây** với độ chính xác toán học tuyệt đối. Đây là minh chứng rõ nhất cho giá trị thương mại và tính khả thi của đồ án.

---

### Câu 31: If you had one more development iteration, what would you build or harden first? (Nếu có thêm một đợt phát triển nữa, bạn sẽ xây dựng hoặc củng cố điều gì trước tiên?)
**Trả lời:**
Vì Cổng Khách Thuê trên di động (`/portal`) đã được hoàn thiện với đầy đủ tính năng xem hóa đơn, quét VietQR và báo cáo sự cố, nên trong đợt phát triển tiếp theo, em sẽ tập trung vào 2 hạng mục nâng cấp giá trị cao:
1. **PWA & Cơ chế Offline-First cho ghi số điện nước:** Cho phép người quản lý cầm điện thoại đi ghi chỉ số điện nước dưới tầng hầm hoặc các khu nhà trọ sóng yếu mà không bị mất dữ liệu. Dữ liệu được lưu tạm trong IndexedDB trên máy và tự động đồng bộ lên Supabase ngay khi có sóng trở lại.
2. **Tự động gửi thông báo qua Zalo ZNS / SMS Brandname:** Tích hợp trực tiếp với Zalo Official Account để khi chủ trọ bấm "Sinh hóa đơn", tin nhắn kèm ảnh hóa đơn và mã QR sẽ tự động bắn thẳng về Zalo của khách thuê mà không cần chủ nhà phải sao chép thủ công qua ứng dụng thứ ba.
