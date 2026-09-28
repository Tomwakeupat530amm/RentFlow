# 📘 SÁCH CẨM NANG HƯỚNG DẪN SỬ DỤNG & KỊCH BẢN THUYẾT TRÌNH ĐỒ ÁN RENTFLOW

> **Phiên bản:** 2.0 (Toàn Diện)  
> **Giao diện HTML tương tác trực quan:** Mở ngay file [`HUONG_DAN_SU_DUNG_RENTFLOW.html`](./HUONG_DAN_SU_DUNG_RENTFLOW.html) trên trình duyệt (có tìm kiếm nhanh, chuyển tab, giao diện Dark/Light mode và nút Copy lời thoại thuyết trình 1-click).

---

## 📑 MỤC LỤC
1. [Giới Thiệu & Điểm Nhấn Công Nghệ](#1-giới-thiệu--điểm-nhấn-công-nghệ)
2. [Cẩm Nang Vận Hành Chi Tiết 10 Module](#2-cẩm-nang-vận-hành-chi-tiết-10-module)
   - [Module 1: Thiết Lập Tổ Chức, Phân Quyền & Cấu Hình PayOS VietQR](#module-1-thiết-lập-tổ-chức-phân-quyền--cấu-hình-payos-vietqr)
   - [Module 2: Quản Lý Toà Nhà & Biểu Phí Dịch Vụ Động](#module-2-quản-lý-toà-nhà--biểu-phí-dịch-vụ-động)
   - [Module 3: Quản Lý Phòng & Bộ Sinh Dãy Phòng Tự Động (Batch Generator)](#module-3-quản-lý-phòng--bộ-sinh-dãy-phòng-tự-động-batch-generator)
   - [Module 4: Khách Thuê, Quản Lý Ở Ghép & Cấp Mã PIN Portal](#module-4-khách-thuê-quản-lý-ở-ghép--cấp-mã-pin-portal)
   - [Module 5: Hợp Đồng & Quy Trình Quyết Toán Trả Phòng (Settlement)](#module-5-hợp-đồng--quy-trình-quyết-toán-trả-phòng-settlement)
   - [Module 6: Ghi Chỉ Số Điện Nước Định Kỳ (Meters)](#module-6-ghi-chỉ-số-điện-nước-định-kỳ-meters)
   - [Module 7: Hoá Đơn, Mã VietQR Động & Chia Sẻ Zalo](#module-7-hoá-đơn-mã-vietqr-động--chia-sẻ-zalo)
   - [Module 8: Quản Lý Sự Cố & Bảo Trì Theo Bảng Kanban](#module-8-quản-lý-sự-cố--bảo-trì-theo-bảng-kanban)
   - [Module 9: Vận Hành Homestay & Điều Phối Buồng Phòng](#module-9-vận-hành-homestay--điều-phối-buồng-phòng)
   - [Module 10: Cổng Khách Thuê Không Mật Khẩu (Tenant Portal)](#module-10-cổng-khách-thuê-không-mật-khẩu-tenant-portal)
3. [Kịch Bản Demo Thuyết Trình Bảo Vệ Đồ Án (10 Phút Thực Chiến)](#3-kịch-bản-demo-thuyết-trình-bảo-vệ-đồ-án-10-phút-thực-chiến)
4. [Bộ Câu Hỏi & Câu Trả Lời Phản Biện Trước Hội Đồng (Q&A Cheatsheet)](#4-bộ-câu-hỏi--câu-trả-lời-phản-biện-trước-hội-đồng-qa-cheatsheet)

---

## 1. GIỚI THIỆU & ĐIỂM NHẤN CÔNG NGHỆ

**RentFlow** là nền tảng SaaS quản lý nhà trọ, căn hộ dịch vụ và chuỗi homestay thông minh. Sản phẩm kết nối khép kín giữa **Chủ nhà / Quản lý** và **Khách thuê trọ** thông qua 2 cổng tương tác chuyên biệt.

### 🌟 4 Điểm Sáng Kỹ Thuật Đạt Điểm Tối Đa Khi Thuyết Trình:
1. **Kiến trúc Multi-Tenancy bảo mật tuyệt đối với Supabase RLS:** Dữ liệu giữa các tổ chức/chủ trọ được cô lập trực tiếp tại tầng Database Engine của PostgreSQL thông qua Row Level Security, ngăn chặn 100% rủi ro rò rỉ dữ liệu.
2. **Tối ưu trải nghiệm tải trang &lt; 500ms:** Kết hợp Next.js 15 Server Components (RSC), memoization `React.cache()` khử trùng lặp truy vấn, chạy song song `Promise.all` và prefetching link thông minh.
3. **Thanh toán VietQR động chuẩn Napas247 & PayOS Webhook:** Tự động tạo link ảnh QR nạp sẵn số tiền còn nợ và nội dung chuyển khoản. Khi tiền về tài khoản, webhook gạch nợ tự động trong 3 giây.
4. **Cổng Tenant Portal không rào cản (Frictionless UX):** Khách thuê đăng nhập nhanh bằng Số điện thoại + Mã PIN 6 số do chủ nhà cấp, không cần ghi nhớ mật khẩu, hỗ trợ quét QR thanh toán và chụp ảnh báo hỏng tức thì.

---

## 2. CẨM NANG VẬN HÀNH CHI TIẾT 10 MODULE

### Module 1: Thiết Lập Tổ Chức, Phân Quyền & Cấu Hình PayOS VietQR
- **Đường dẫn:** `/dashboard/settings` và `/dashboard/settings/payment`
- **Các bước thực hiện:**
  1. *Cấu hình tổ chức:* Đổi tên thương hiệu nhà trọ (ví dụ: *Hệ Thống Nhà Trọ An Bình*).
  2. *Mã mời nhân viên (Invite Code):* Hệ thống sinh sẵn mã mời ngẫu nhiên. Chủ trọ gửi mã này cho nhân viên để họ đăng ký và tự động liên kết vào tổ chức với vai trò `member`.
  3. *Phân quyền RBAC:* Chủ trọ (`owner`) toàn quyền thêm toà nhà, xoá phòng, xem doanh thu và cấu hình API ngân hàng. Nhân viên (`member`) chỉ có quyền ghi điện nước, xem phòng và tiếp nhận sự cố.
  4. *Cài đặt VietQR & PayOS:* Nhập Tên ngân hàng, Số tài khoản, Tên chủ tài khoản. Nhập thêm API Key & Checksum Key từ PayOS để kích hoạt gạch nợ tự động.

### Module 2: Quản Lý Toà Nhà & Biểu Phí Dịch Vụ Động
- **Đường dẫn:** `/dashboard/buildings` và `/dashboard/buildings/[id]`
- **Các bước thực hiện:**
  1. Nhấn **Thêm toà nhà**, nhập Tên toà, Địa chỉ, Số tầng.
  2. Mở chi tiết toà nhà, chọn tab **Dịch vụ & Biểu phí** để thiết lập:
     - *Điện:* 3.800 đ/kWh (tính theo số đo đồng hồ).
     - *Nước:* 25.000 đ/m³ (tính theo đồng hồ) hoặc 80.000 đ/người (tính theo đầu người).
     - *Phí cố định:* Rác (50.000 đ/tháng), Internet wifi (100.000 đ/tháng).
     - *Xe máy:* 120.000 đ/xe/tháng (tính theo số lượng xe đăng ký).

### Module 3: Quản Lý Phòng & Bộ Sinh Dãy Phòng Tự Động (Batch Generator)
- **Đường dẫn:** `/dashboard/rooms` và `/dashboard/buildings/[id]`
- **Các bước thực hiện:**
  1. *Tạo từng phòng lẻ:* Nhấn "Thêm phòng", chọn toà nhà, nhập số phòng, tầng, diện tích, giá thuê.
  2. *⚡ Tạo phòng hàng loạt (Batch Generator):* Trong chi tiết toà nhà, nhấn **Tạo phòng tự động**.
     - Nhập *Tầng bắt đầu* (ví dụ: 1) và *Tầng kết thúc* (ví dụ: 3).
     - Nhập *Số phòng mỗi tầng* (ví dụ: 4 phòng).
     - Chọn định dạng tên phòng: `101, 102` hoặc có tiền tố `P101, P102` hoặc dấu chấm `P.101, P.102`.
     - Nhập giá thuê chung và diện tích mặc định.
     - Xem bảng **Preview**, bỏ chọn phòng không muốn tạo, sau đó bấm **Tạo hàng loạt**. Hệ thống tự động bỏ qua nếu phát hiện tên phòng đã tồn tại.

### Module 4: Khách Thuê, Quản Lý Ở Ghép & Cấp Mã PIN Portal
- **Đường dẫn:** `/dashboard/tenants` và `/dashboard/rooms/[id]`
- **Các bước thực hiện:**
  1. *Thêm khách thuê đại diện:* Nhấn **Thêm khách thuê**, nhập Họ tên, SĐT, Số CCCD, quê quán, tải ảnh 2 mặt CCCD.
  2. *Cấp mã PIN Portal:* Mỗi khách thuê có một trường mã PIN 6 số (ví dụ: `123456`) dùng để đăng nhập vào cổng `/portal`.
  3. *Thêm người ở ghép (Roommates):* Vào chi tiết phòng, tab **Thành viên**, nhấn **Thêm người ở ghép** để lưu danh sách người ở cùng phục vụ việc khai báo tạm trú và tính tiền dịch vụ theo đầu người.

### Module 5: Hợp Đồng & Quy Trình Quyết Toán Trả Phòng (Settlement)
- **Đường dẫn:** `/dashboard/contracts`
- **Các bước thực hiện:**
  1. *Tạo hợp đồng mới:* Nhấn **Tạo hợp đồng**, chọn Khách thuê, chọn Toà nhà, chọn Phòng trống. Nhập Tiền cọc, Ngày bắt đầu, Ngày kết thúc và *Chỉ số điện nước ban đầu lúc bàn giao*. Khi tạo xong, phòng tự động chuyển sang trạng thái "Đang thuê" (Occupied).
  2. *Quy trình Quyết toán trả phòng (Check-out):* Khi khách dọn đi, nhấn nút **Quyết toán trả phòng**:
     - *Bước 1:* Nhập chỉ số điện nước ngày cuối. Hệ thống tính sản lượng và nhân đơn giá phát sinh.
     - *Bước 2:* Thêm các khoản cấn trừ hư hại (ví dụ: Làm bẩn tường: 200.000 đ, Làm gãy vòi sen: 150.000 đ) và cộng nợ cũ nếu có.
     - *Bước 3:* Hệ thống lấy Tiền cọc trừ đi Tổng khấu trừ để ra số tiền hoàn trả lại cho khách.
     - *Bước 4:* Bấm **Sao chép tin nhắn Zalo** để gửi biên bản quyết toán cho khách, thanh lý hợp đồng và trả phòng về trạng thái "Trống" (Vacant).

### Module 6: Ghi Chỉ Số Điện Nước Định Kỳ (Meters)
- **Đường dẫn:** `/dashboard/meters`
- **Các bước thực hiện:**
  1. Chọn Tháng/Năm chốt số và chọn Toà nhà.
  2. Màn hình hiển thị danh sách phòng có người ở kèm chỉ số kỳ trước (Old reading).
  3. Nhập **Chỉ số mới (New reading)**. Hệ thống tự động tính sản lượng tiêu thụ trong tháng.
  4. *Validation chống sai sót:* Nếu nhập chỉ số mới nhỏ hơn chỉ số cũ, hệ thống báo lỗi đỏ và chặn lưu nhằm ngăn ngừa việc ghi nhầm số đồng hồ.

### Module 7: Hoá Đơn, Mã VietQR Động & Chia Sẻ Zalo
- **Đường dẫn:** `/dashboard/invoices` và `/dashboard/invoices/[id]`
- **Các bước thực hiện:**
  1. *Sinh hoá đơn hàng loạt:* Nhấn **Sinh hoá đơn tháng này**. Hệ thống tự động tổng hợp Tiền phòng + Tiền điện + Tiền nước + Dịch vụ theo hợp đồng.
  2. *Mã VietQR động:* Mỗi hoá đơn tự sinh một link ảnh VietQR Napas247 nạp sẵn số tiền nợ còn lại và nội dung chuyển khoản chuẩn.
  3. *Chia sẻ Zalo:* Nhấn nút **Chia sẻ Zalo** để mở modal với 2 mẫu soạn sẵn:
     - *Mẫu 1:* Bảng kê chi tiết tiền phòng + Link ảnh VietQR động.
     - *Mẫu 2:* Mẫu nhắc nợ lịch sự dành cho hoá đơn quá hạn.
  4. *Gạch nợ PayOS Webhook:* Khi khách chuyển khoản đúng nội dung, webhook tự động đổi trạng thái sang "Đã thanh toán" (Paid).

### Module 8: Quản Lý Sự Cố & Bảo Trì Theo Bảng Kanban
- **Đường dẫn:** `/dashboard/incidents`
- **Các bước thực hiện:**
  1. Tiếp nhận sự cố hỏng hóc từ khách thuê (gửi qua Portal) hoặc chủ nhà tự tạo.
  2. Bảng Kanban gồm 3 cột: **Chờ tiếp nhận (Open)** ➜ **Đang xử lý (In Progress)** ➜ **Đã giải quyết (Resolved)**.
  3. Dễ dàng kéo thả các thẻ sự cố, cập nhật chi phí sửa chữa để tự động hạch toán vào mục Chi phí (Expenses).

### Module 9: Vận Hành Homestay & Điều Phối Buồng Phòng
- **Đường dẫn:** `/dashboard/homestay/bookings` và `/dashboard/homestay/housekeeping`
- **Các bước thực hiện:**
  1. *Lịch đặt phòng homestay:* Đặt phòng theo ngày check-in và check-out. Thuật toán kiểm tra giao thoa ngày tự động chặn lỗi đặt trùng phòng (Double-booking).
  2. *Quản lý buồng phòng:* Khi khách check-out, phòng tự chuyển sang trạng thái "Cần dọn dẹp" (Dirty). Nhân viên nhận phòng dọn dẹp chuyển sang "Đang dọn" (In Progress) và "Đã sạch" (Clean) để sẵn sàng đón khách mới.

### Module 10: Cổng Khách Thuê Không Mật Khẩu (Tenant Portal)
- **Đường dẫn:** `/portal/login`, `/portal`, `/portal/invoices`, `/portal/incidents`
- **Các bước thực hiện:**
  1. Khách truy cập `/portal/login`, nhập **Số điện thoại** và **Mã PIN 6 số**.
  2. Trang chủ Portal hiển thị hợp đồng thuê, thông báo toà nhà, thông tin phòng.
  3. Mục Hoá đơn: Xem chi tiết điện nước, quét mã VietQR nạp sẵn số tiền để thanh toán tức thì.
  4. Mục Báo sự cố: Chụp ảnh trực tiếp từ điện thoại gửi cho chủ nhà khi xảy ra hư hỏng thiết bị.

---

## 3. KỊCH BẢN DEMO THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN (10 PHÚT THỰC CHIẾN)

| Thời Gian | Phân Hệ Demo | Lời Thoại Thuyết Trình Gợi Ý | Thao Tác Chuột Trực Tiếp |
| :--- | :--- | :--- | :--- |
| **00:00 - 01:00**<br>(1 Phút) | **Tổng Quan & Đặt Vấn Đề** | "Kính thưa Hội đồng, quản lý nhà trọ truyền thống thường tốn nhiều giờ ghi sổ, tính nhầm tiền điện nước và thiếu minh bạch với người thuê. Hôm nay nhóm em xin trình diễn **RentFlow** - Giải pháp chuyển đổi số toàn diện kết nối Chủ nhà và Khách thuê qua 2 cổng độc lập." | Mở `/dashboard`, chỉ vào KPI doanh thu, tỷ lệ phòng trống và menu điều hướng. |
| **01:00 - 02:30**<br>(1.5 Phút) | **Khởi Tạo Dãy Phòng Siêu Tốc** | "Khi chủ nhà mới tiếp nhận toà nhà, thay vì nhập từng phòng, em dùng tính năng **Batch Room Generator**. Chọn Tầng 1 đến 3, 4 phòng/tầng, giá 3.5 triệu. Bấm 'Tạo hàng loạt' và 12 phòng đã được khởi tạo trong 0.2 giây." | Vào `/buildings/[id]` ➜ Bấm **⚡ Tạo phòng tự động** ➜ Nhập tham số ➜ Nhấn Xác nhận tạo. |
| **02:30 - 04:00**<br>(1.5 Phút) | **Đón Khách & Làm Hợp Đồng** | "Có khách đến thuê phòng P101, em tạo hợp đồng mới, nhập tiền cọc 3.5 triệu và chỉ số điện nước ban đầu. Phòng P101 chuyển sang màu xanh (Occupied) và hệ thống cấp mã PIN 6 số cho khách thuê." | Vào `/contracts` ➜ Bấm **Tạo hợp đồng** ➜ Chọn khách, chọn P101 ➜ Lưu ➜ Xem phòng đổi màu. |
| **04:00 - 06:00**<br>(2 Phút) | **Chốt Điện Nước & Sinh Hoá Đơn VietQR** | "Cuối tháng, em vào mục **Meters** ghi số điện nước mới. Thuật toán tự chặn nếu em gõ số mới nhỏ hơn số cũ. Sau đó vào **Invoices** bấm 'Sinh hoá đơn hàng loạt'. Hoá đơn tự động gắn mã **VietQR động** nạp sẵn tiền nợ và nút chia sẻ Zalo 1-click." | Vào `/meters` nhập số ➜ Vào `/invoices` bấm sinh hoá đơn ➜ Mở hoá đơn xem QR ➜ Bấm **Chia sẻ Zalo**. |
| **06:00 - 07:30**<br>(1.5 Phút) | **Trải Nghiệm Tenant Portal & Báo Hỏng** | "Bây giờ trong vai người thuê trọ, em mở tab ẩn danh vào `/portal/login`, nhập SĐT và mã PIN. Khách thấy ngay hoá đơn để quét VietQR và gửi phản ánh gãy vòi sen kèm ảnh chụp. Sự cố nhảy ngay lên bảng Kanban của chủ nhà." | Mở Tab ẩn danh vào `/portal/login` ➜ Nhập SĐT + PIN ➜ Xem hoá đơn ➜ Gửi báo hỏng ➜ Xem Kanban ở tab Chủ. |
| **07:30 - 09:00**<br>(1.5 Phút) | **Quyết Toán Trả Phòng Hoàn Cọc** | "Khi khách dọn đi, em dùng tính năng **Quyết toán trả phòng**: chốt điện nước ngày cuối, trừ tiền bẩn tường 200.000 đ vào cọc 3.5 triệu, hệ thống tự tính tiền hoàn cọc và xuất tin nhắn Zalo, trả phòng về trạng thái Trống." | Vào `/contracts` ➜ Bấm **Quyết toán trả phòng** ➜ Nhập khoản trừ ➜ Xác nhận ➜ Xem phòng về trạng thái Trống. |
| **09:00 - 10:00**<br>(1 Phút) | **Kiến Trúc Kỹ Thuật & Kết Luận** | "Dự án sử dụng Next.js 15, React 19, Supabase RLS Multi-tenancy và tối ưu tải trang &lt;500ms. Em xin cảm ơn Hội đồng và sẵn sàng nhận câu hỏi phản biện." | Click chuyển menu liên tục để biểu diễn tốc độ &lt;500ms mượt mà không trắng trang. |

---

## 4. BỘ CÂU HỎI & CÂU TRẢ LỜI PHẢN BIỆN TRƯỚC HỘI ĐỒNG (Q&A CHEATSHEET)

### Câu 1: Làm sao đảm bảo dữ liệu giữa các chủ nhà không bao giờ bị lẫn lộn?
> **Đáp án ghi điểm:** Hệ thống áp dụng **Row Level Security (RLS)** ở cấp nhân PostgreSQL của Supabase. Mọi bảng dữ liệu đều gắn `organization_id`. Khi người dùng truy vấn, PostgreSQL thực thi chính sách kiểm tra `auth.uid()` khớp với tổ chức của họ. Hacker dù có sửa mã frontend hay gọi trực tiếp REST API cũng không thể lấy được bản ghi của chủ trọ khác.

### Câu 2: Tại sao Tenant Portal lại dùng mã PIN 6 số mà không dùng email/mật khẩu?
> **Đáp án ghi điểm:** Khách thuê trọ thường có tâm lý ngại đăng ký tài khoản rườm rà và hay quên mật khẩu. Sử dụng Số điện thoại + Mã PIN 6 số do chủ nhà cấp tạo trải nghiệm **Frictionless UX** (tiện lợi tối đa). Khi hợp đồng kết thúc hoặc khách dọn đi, mã PIN sẽ tự động bị huỷ, đảm bảo an toàn tuyệt đối.

### Câu 3: Làm thế nào để đạt được tốc độ chuyển trang dưới 500ms?
> **Đáp án ghi điểm:** 
> 1. Next.js 15 React Server Components (RSC) xử lý dữ liệu trước tại server.
> 2. Dùng `React.cache()` memoize hàm xác thực tổ chức người dùng `getCurrentUserOrganization()`.
> 3. Chạy song song các câu lệnh truy vấn qua `Promise.all()`.
> 4. Bật chế độ `prefetch={true}` trên các liên kết điều hướng để trình duyệt nạp sẵn dữ liệu khi người dùng rê chuột.

### Câu 4: Xử lý tranh chấp đặt phòng trùng lịch (Race condition) trong Homestay như thế nào?
> **Đáp án ghi điểm:** Hệ thống bảo vệ 2 lớp:
> - *Lớp 1 (Application):* Kiểm tra điều kiện chồng lấn ngày `(check_in <= new_check_out AND check_out >= new_check_in)` trước khi tạo.
> - *Lớp 2 (Database Engine):* Sử dụng ràng buộc loại trừ PostgreSQL `EXCLUDE USING gist (room_id WITH =, daterange(check_in, check_out) WITH &&)`. Ràng buộc này đảm bảo tính toàn vẹn cấp độ vi giây kể cả khi có 2 request gửi đồng thời.

### Câu 5: Nếu Webhook PayOS bị gọi lặp lại (Retry) do mạng chập chờn thì sao?
> **Đáp án ghi điểm:** Endpoint Webhook được thiết kế theo nguyên lý **Idempotent** (bất biến): Kiểm tra chữ ký HMAC SHA256 để chống giả mạo, sau đó kiểm tra trạng thái hoá đơn. Nếu hoá đơn đã là `paid`, hệ thống trả ngay HTTP 200 mà không cộng tiền hay ghi log trùng lặp.

---
*Tài liệu được biên soạn phục vụ buổi báo cáo và bảo vệ đồ án tốt nghiệp RentFlow.*
