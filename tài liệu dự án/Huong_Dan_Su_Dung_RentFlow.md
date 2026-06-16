# Hướng dẫn sử dụng Hệ thống Quản lý Bất động sản RentFlow

## Giới thiệu
RentFlow là giải pháp phần mềm toàn diện giúp chủ nhà và người quản lý vận hành khu trọ, căn hộ dịch vụ và cả mô hình homestay ngắn hạn một cách tối ưu, chuyên nghiệp. Với RentFlow, bạn có thể dễ dàng quản lý thông tin khách thuê, lịch đặt phòng, tự động hóa tính toán hóa đơn điện nước, tích hợp thanh toán online và theo dõi tài chính mọi lúc, mọi nơi.

---

## 📚 Mục lục
1. [Khởi tạo & Cấu hình Ban đầu](#1-khởi-tạo--cấu-hình-ban-đầu)
2. [Quản lý Dài hạn (Phòng trọ / Căn hộ)](#2-quản-lý-dài-hạn-phòng-trọ--căn-hộ)
3. [Quản lý Ngắn hạn (Homestay)](#3-quản-lý-ngắn-hạn-homestay)
4. [Quản lý Sự cố & Bảo trì](#4-quản-lý-sự-cố--bảo-trì)
5. [Theo dõi Báo cáo (Dashboard)](#5-theo-dõi-báo-cáo-dashboard)

---

## 1. Khởi tạo & Cấu hình Ban đầu

Để bắt đầu sử dụng RentFlow, bạn cần thiết lập cấu trúc nền tảng theo thứ tự sau:

### 1.1. Thiết lập Tổ chức & Nhân sự (Settings)
- Truy cập mục **Settings** ở menu bên trái.
- Tại đây, bạn có thể cập nhật thông tin tên Tổ chức quản lý của mình.
- Sao chép **Mã mời (Invite Code)** để gửi cho nhân viên/kế toán cùng tham gia quản lý.

### 1.2. Cấu hình Thanh toán (Payment Settings)
- Hệ thống hỗ trợ sinh mã VietQR tự động để khách thuê dễ dàng quét mã chuyển khoản.
- Truy cập **Settings -> Thanh toán**.
- Chọn Ngân hàng của bạn và nhập chính xác **Số tài khoản ngân hàng**, **Tên chủ tài khoản**.
- Nếu bạn có sử dụng cổng thanh toán **PayOS**, mã QR sẽ tự động được tích hợp và gạch nợ tự động trên hệ thống khi khách thanh toán thành công.

### 1.3. Tạo Tòa nhà / Khu trọ (Buildings)
- Truy cập mục **Buildings**.
- Nhấn "Thêm mới" để tạo các khu trọ hoặc cơ sở homestay mà bạn đang quản lý.
- Điền đầy đủ thông tin: Tên khu (VD: Cơ sở 1 - Tân Bình), Địa chỉ, số tầng,...

### 1.4. Cài đặt Bảng giá Dịch vụ
- Sau khi tạo xong Tòa nhà, bạn nhấn vào tên tòa nhà đó trong danh sách để vào trang chi tiết.
- Chuyển sang phần quản lý **Dịch vụ (Service Prices)** của tòa nhà đó.
- Tại đây, bạn có thể thiết lập giá điện, nước, rác, wifi... được áp dụng RIÊNG cho tòa nhà này.

### 1.5. Tạo phòng riêng lẻ và hàng loạt (Rooms)
- Quay lại mục **Rooms**.
- Nhấn "Thêm phòng" > Bạn có thể tạo **Từng phòng một** hoặc chuyển sang tab **Thêm nhiều phòng** để tạo hàng loạt (VD: nhập `101, 102, 103`).
- **Lưu ý:** Khi tạo phòng, bạn cần chọn loại phòng. Đối với phòng trọ dài hạn, hệ thống sẽ quản lý bằng Hợp đồng. Đối với phòng homestay, hệ thống sẽ quản lý bằng Lịch đặt phòng (Booking).

---

## 2. Quản lý Dài hạn (Phòng trọ / Căn hộ)

Khi có khách đến thuê tháng, quy trình thực hiện như sau:

### 2.1. Thêm Khách thuê (Tenants) & Người ở ghép (Roommates)
- Truy cập **Tenants** > Nhấn "Thêm mới" để thêm thông tin người đại diện thuê.
- Hệ thống hỗ trợ đính kèm hình ảnh mặt trước/sau của CCCD/CMND bảo mật trên Cloud.
- Để quản lý người ở ghép: Vào chi tiết Phòng đang có người ở > Tab **Khách thuê** > Nhấn **Thêm người ở ghép**.

### 2.2. Làm Hợp đồng (Contracts)
- Truy cập **Contracts** > Nhấn "Tạo hợp đồng".
- Chọn Khách thuê, Tòa nhà, và Phòng (chỉ chọn được phòng Trống).
- Nhập mốc thời gian, tiền cọc, và **Chỉ số điện nước ban đầu**.
- Trạng thái phòng tự động chuyển thành "Đang thuê" (Rented).

### 2.3. Vận hành định kỳ Hàng tháng
1. **Chốt điện nước:** Cuối tháng, vào mục **Meters** và nhập chỉ số mới. Hệ thống sẽ tự kiểm tra và tính toán lượng tiêu thụ.
2. **Lập hóa đơn:** Vào mục **Invoices** > Nhấn "Tạo hóa đơn". Tiền phòng, điện, nước và dịch vụ sẽ được tự động tổng hợp. Bạn có thể xuất PDF để gửi khách.
3. **Thanh toán:** Khi xem hóa đơn, khách thuê sẽ thấy mã VietQR (hoặc PayOS) với số tiền và nội dung chuyển khoản tự động. Bạn cũng có thể bấm "Cập nhật thanh toán" để xác nhận thủ công nếu khách trả tiền mặt.

---

## 3. Quản lý Ngắn hạn (Homestay)

RentFlow cung cấp một phân hệ hoàn toàn riêng biệt để quản lý Homestay/Airbnb.

### 3.1. Lịch biểu trực quan (Timeline Calendar)
- Truy cập **Homestay -> Bookings**.
- Bạn sẽ thấy một bảng lịch biểu theo dõi tình trạng của tất cả các phòng homestay trong tháng.
- Các giao dịch đặt phòng (Booking) được hiển thị dạng thanh kéo dài qua các ngày, giúp bạn dễ dàng xem phòng nào trống, phòng nào bận.

### 3.2. Đặt phòng (Tạo Booking)
- Tại trang Lịch biểu, nhấn nút **Thêm lượt đặt phòng** (hoặc nhấp trực tiếp vào ô ngày của phòng muốn đặt).
- Điền các thông tin: Tên khách hàng, Số điện thoại, Ngày Check-in, Ngày Check-out, Tổng tiền.
- **Chống đặt trùng phòng:** Hệ thống có cơ chế kiểm tra tự động. Nếu ngày bạn chọn bị trùng lấp với một khách khác đã đặt trước đó trong cùng một phòng, hệ thống sẽ cảnh báo và chặn lại để tránh rủi ro "Overbooking".

---

## 4. Quản lý Sự cố & Bảo trì

- Giúp bạn theo dõi các yêu cầu sửa chữa từ khách thuê (như bồn cầu nghẹt, bóng đèn hỏng...).
- Truy cập **Incidents** tạo một sự cố mới. Chọn Phòng xảy ra sự cố, mức độ ưu tiên, đính kèm hình ảnh.
- Giao diện thiết kế dạng bảng Kanban (To Do, In Progress, Done) cho phép bạn kéo thả để thay đổi trạng thái tiến độ xử lý dễ dàng.

---

## 5. Theo dõi Báo cáo (Dashboard)

- Màn hình **Dashboard** cung cấp bức tranh số liệu tổng quan theo thời gian thực:
  - Doanh thu theo thời gian.
  - Tỷ lệ lấp đầy (Bao nhiêu phòng trống, phòng kín, phòng đang bảo trì).
  - Cảnh báo các Hóa đơn trễ hạn và Sự cố tồn đọng.
