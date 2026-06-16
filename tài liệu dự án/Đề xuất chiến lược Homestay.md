# Báo cáo Phân tích & Đề xuất Mô hình Homestay / Short-term Rentals

Tiếp nối triết lý **"Đột phá có kiểm soát"**, việc mở rộng RentFlow từ mô hình cho thuê dài hạn (Long-term) sang mô hình Homestay/Khách sạn mini (Short-term) là một bước đi cực kì tiềm năng. Tuy nhiên, luồng vận hành của hai mô hình này hoàn toàn khác biệt. Dưới đây là phân tích và đề xuất chiến lược thực thi kết hợp với hệ thống **Agents & Workflows**.

---

## 1. Phân tích Sự Khác Biệt Cốt Lõi (Bài toán cốt lõi)

Để `@product-manager` (PM) không bị bỡ ngỡ, chúng ta cần đóng khung sự khác biệt:

| Tiêu chí | Dài hạn (Hiện tại) | Ngắn hạn / Homestay (Mục tiêu) |
| :--- | :--- | :--- |
| **Đơn vị giao dịch** | Hợp đồng (Theo Tháng / Năm) | Lịch đặt phòng (Theo Giờ / Đêm / Ngày) |
| **Tính phí Điện / Nước** | Chốt chỉ số hàng tháng | Trọn gói vào tiền phòng |
| **Nhịp độ thay đổi** | Thấp (Vài tháng / Vài năm chuyển 1 lần) | Rất cao (Thay đổi liên tục trong ngày) |
| **Quản trị phòng** | Trống $\rightarrow$ Đang Thuê | Trống $\rightarrow$ Đã đặt trước (Booked) $\rightarrow$ Đang ở (Occupied) $\rightarrow$ Đang dọn dẹp (Cleaning) |
| **Tâm điểm UI/UX** | Danh sách phòng (Table View) | Lịch dạng Timeline / Gantt Chart (Calendar View) |

---

## 2. Đề xuất Kiến trúc & Tính năng (Architecture Definition)

Dựa theo workflow `architecture_design.md`, đây là kiến trúc một đập ăn luôn do `@database-architect` đề xuất:

### Khối Dữ liệu (Database)
1. **Lược đồ (Schema):** Không dùng lại bảng `contracts` cho Homestay. Bắt buộc tạo bảng mới `bookings`.
   - Các trường quan trọng: `room_id`, `guest_name`, `guest_phone`, `check_in_time`, `check_out_time`, `total_price`, `status` (pending, confirmed, checked_in, checked_out, cancelled).
2. **Nâng cấp bảng Phòng (`rooms`):** 
   - Thêm các cột giá: `hourly_rate` (Giá theo giờ), `nightly_rate` (Giá qua đêm), `daily_rate` (Giá theo ngày).

### Khối Giao diện (Frontend)
1. **Booking Calendar (Timeline):** Một màn hình ngang hiển thị các phòng ở cột trái, và trục thời gian (Ngày/Giờ) ở thanh ngang. Cho phép lễ tân nhìn lướt qua là biết phòng nào đang trống giờ nào.
2. **Quick Check-in / POS:** Một cửa sổ popup giúp lễ tân thao tác tạo Booking và Check-in cho khách vãng lai (Walk-in) dưới 30 giây.

---

## 3. Bản đồ Hợp tác Agents & Điểm Chạm AI (AI-Leveraged Execution)

Chúng ta sẽ chạy workflow `product_definition_scoping.md` để xác định luồng đi. Nếu bạn đồng ý, các Agent sẽ được điều phối như sau:

### Giai đoạn 1: Planning & Scoping
- 🧠 **`@product-manager`:** Sẽ làm rõ **PRD (Product Requirement Document)**. Cụ thể trả lời câu hỏi: *Làm sao để xử lý tình huống khách thuê theo giờ nhưng lại lố giờ sang qua đêm?* Lên bộ quy tắc tính tiền Phụ thu (Surcharge).
- 🧩 **`@database-architect`:** Viết SQL Constraints. Đây là phần khó nhất: Phải dùng Database Trigger hoặc Constraint để **Chống trùng lịch (Overbooking)**. (Không thể có 2 bookings cho cùng 1 phòng giao nhau về mặt thời gian).

### Giai đoạn 2: Bán Chéo (Premium Features) với AI & Agent
Phần Homestay này sẽ là "Mỏ vàng" cho gói Premium. Các tính năng đột phá:

1. **AI Smart Allocation (Tối ưu xếp phòng):** 
   - Thay vì lọt thỏm các "khoảng thời gian chết" (Phòng trống 2 tiếng giữa 2 lịch đặt). `@backend-specialist` có thể viết thuật toán AI gợi ý lễ tân kéo/thả khách vào đúng phòng để lấp đầy tối đa trục thời gian.
2. **Đồng bộ Kênh OTA (Channel Manager):**
   - `@devops-engineer` và `@backend-specialist` thiết lập hệ thống tự động đồng bộ lịch (Parse file iCal) từ **Airbnb, Booking.com, Traveloka**. Tránh việc khách trên mạng đặt trùng phòng với khách vãng lai.
3. **Giá Động (Dynamic Pricing Agent):**
   - Áp dụng "Thuật toán tăng giá": Khi khách sạn đạt 80% công suất phòng trong ngày lễ, phần mềm tự động chớp nháy gợi ý chủ nhà: *"Khu vực đang cháy phòng, đề xuất tăng giá nightly_rate lên 15%"*.
4. **Housekeeping Workflow (Dọn phòng):**
   - Tự động chuyển trạng thái phòng sang "Cần Dọn Dẹp" ngay khi khách Check-out.

### Giai đoạn 3: Thực thi Code (Implementation)
- 🎨 **`@frontend-specialist`:** Nhiệm vụ sống còn là dựng được thư viện **Gantt Chart / Calendar Timeline** thật mượt mà và trực quan, hoạt động tốt cả trên Mobile cho chủ nhà đi ngoài đường vẫn xem được lịch.
- ⚙️ **`@qa-automation-engineer`:** Viết test scripts để thử hàng ngàn trường hợp chênh lệch múi giờ, đặt lố giờ, thanh toán cọc...

---

## 4. Kết luận & Chốt phương án

Việc đưa Homestay vào RentFlow không chỉ là thêm 1 tính năng, mà là **Mở ra một phân khúc khách hàng mới hoàn toàn**. 

**Đề xuất các bước tiếp theo:**
Nếu bạn thấy phân tích này đúng Insight, mình đề xuất chúng ta **chia nhỏ** để làm. 
Bước đầu tiên dễ nhất: Gọi `@database-architect` và `@product-manager` vào thiết kế "Bảng Bookings" và UI "Lưu trữ lịch đặt phòng thủ công" trước. Bạn có muốn bắt đầu với phần Database ngay không?
