# Hướng dẫn sử dụng Hệ thống Quản lý Phòng trọ RentFlow

## Giới thiệu
RentFlow là giải pháp phần mềm toàn diện giúp chủ nhà và người quản lý vận hành khu trọ, căn hộ dịch vụ một cách tối ưu, chuyên nghiệp. Với RentFlow, bạn có thể dễ dàng quản lý thông tin khách thuê, tự động hóa tính toán hóa đơn điện nước và theo dõi tài chính mọi lúc, mọi nơi.

---

## 📚 Mục lục
1. [Khởi tạo dữ liệu ban đầu cơ bản](#1-khởi-tạo-dữ-liệu-ban-đầu-cơ-bản)
2. [Quản lý Khách thuê & Hợp đồng](#2-quản-lý-khách-thuê--hợp-đồng)
3. [Vận hành định kỳ (Hàng tháng)](#3-vận-hành-định-kỳ-hàng-tháng)
4. [Quản lý Sự cố & Bảo trì](#4-quản-lý-sự-cố--bảo-trì)
5. [Theo dõi Báo cáo (Dashboard)](#5-theo-dõi-báo-cáo-dashboard)

---

## 1. Khởi tạo dữ liệu ban đầu cơ bản

Để bắt đầu sử dụng RentFlow, bạn cần thiết lập cấu trúc nền tảng theo thứ tự sau:

### 1.1. Thiết lập Tổ chức & Nhân sự (Settings)
- Truy cập mục **Settings** ở menu bên trái.
- Tại đây, bạn có thể cập nhật thông tin tên Tổ chức quản lý của mình.
- Bạn cũng có thể tạo và sao chép **Mã mời (Invite Code)** để gửi cho nhân viên/kế toán cùng tham gia quản lý trên hệ thống.

### 1.2. Tạo Tòa nhà / Khu trọ (Buildings)
- Truy cập mục **Buildings**.
- Nhấn "Thêm mới" để tạo các khu trọ mà bạn đang quản lý.
- Điền đầy đủ thông tin: Tên khu (VD: Cơ sở 1 - Tân Bình), Địa chỉ, số tầng,...

### 1.3. Cài đặt Bảng giá Dịch vụ
- Sau khi tạo xong Tòa nhà, bạn nhấn vào tên tòa nhà đó trong danh sách để vào trang chi tiết.
- Chuyển sang phần quản lý **Dịch vụ (Service Prices)** của tòa nhà đó.
- Tại đây, bạn có thể thiết lập giá điện, nước, rác, wifi... được áp dụng RIÊNG cho tòa nhà này.
- **Ví dụ:** Điện (3.500đ/kWh), Nước (25.000đ/khối), Rác (50.000đ/tháng). Giá dịch vụ có thể khác nhau tùy từng cơ sở/tòa nhà.

### 1.4. Tạo cấu cấu phòng riêng lẻ (Single Room)
- Quay lại mục **Rooms**.
- Nhấn "Thêm phòng", chọn Tòa nhà mà phòng đó thuộc về.
- Điền tên phòng (VD: 101, 102), Diện tích, Giá thuê mặc định hàng tháng.
- Hệ thống sẽ tự động cập nhật trạng thái phòng là "Trống" (Available).

### 1.5. Tạo phòng hàng loạt (Bulk Create)
- Tại mục **Rooms** > Nhấn "Thêm phòng".
- Chuyển sang Tab **"Thêm nhiều phòng"**.
- Nhập danh sách tên phòng ngăn cách bằng dấu phẩy (VD: `P101, P102, P103, P104`).
- Cấu hình chung cho cả danh sách: Tầng, Loại phòng, Diện tích, Giá thuê.
- Nhấn **"Thêm hàng loạt"**. Hệ thống sẽ tự động tạo toàn bộ danh sách và báo lỗi nếu có bất kỳ tên phòng nào bị trùng lặp trong toà nhà.

---

## 2. Quản lý Khách thuê & Hợp đồng

Khi có khách đến thuê, quy trình thực hiện như sau:

### 2.1. Thêm Khách thuê (Tenants)
- Truy cập **Tenants** > Nhấn "Thêm mới".
- Cập nhật thông tin chi tiết của người đại diện thuê: Họ và tên, SĐT, CCCD/CMND.
- Hệ thống hỗ trợ đính kèm hình ảnh mặt trước/sau của giấy tờ tùy thân bảo mật trên Cloud.

### 2.2. Làm Hợp đồng (Contracts)
Đây là bước quan trọng để gắn Khách thuê vào Căn phòng.
- Truy cập **Contracts** > Nhấn "Tạo hợp đồng".
- Chọn: Khách thuê, Tòa nhà, Cuối cùng là Phòng (chỉ chọn được những phòng đang Trống).
- Điền các mốc thời gian: Ngày bắt đầu ở, Ngày kết thúc hợp đồng, Tiền đặt cọc.
- **Xác nhận Hợp đồng:** Sau khi ký hợp đồng giấy, bạn hãy tải ảnh scan/chụp ảnh hợp đồng lên hệ thống.
  - 🟢 **Đã xác nhận:** Khi có ảnh scan, hệ thống sẽ tự động đánh dấu hợp đồng đã hoàn tất về mặt pháp lý.
  - 🟡 **Chưa xác nhận:** Nếu chưa có ảnh scan, hệ thống sẽ nhắc nhở để bạn không quên lưu trữ tài liệu quan trọng.
- **Lưu ý:** Ngay khi hợp đồng được tạo thành công, trạng thái phòng tự động chuyển thành "Đang thuê" (Occupied).

### 2.3. Quản lý người ở ghép (Roommates)
Một phòng có thể có nhiều người ở cùng. Để quản lý nhân khẩu chính xác:
- Vào chi tiết Phòng đang có người ở.
- Chuyển sang Tab **"Khách thuê"**.
- Tại đây bạn sẽ thấy danh sách thành viên hiện tại của phòng.
- Nhấn **"Thêm người ở ghép"** để nhập thông tin (Họ tên, SĐT, CCCD) cho những người ở cùng khách đại diện.
- Thông tin này dùng để quản lý nhân khẩu và khai báo tạm trú, không ảnh hưởng đến việc tính toán hoá đơn.

---

## 3. Vận hành định kỳ (Hàng tháng)
Quy trình cuối tháng để thu tiền khách thuê:

### Bước 1: Chốt chỉ số Điện nước (Meters)
- Đi đến mục **Meters**.
- Ứng dụng sẽ hiển thị danh sách các phòng đang có người ở cùng chỉ số điện nước cũ.
- Bạn chỉ cần nhập **Chỉ số hiện tại**. Hệ thống tự động tính toán ra lượng tiêu thụ.

### Bước 2: Lập Hóa đơn (Invoices)
- Di chuyển sang mục **Invoices** > Chọn "Tạo hóa đơn".
- Hệ thống tự động tổng hợp: Tiền thuê phòng, Tiền điện, Tiền nước và các Phí dịch vụ.
- Bạn có thể **Xuất PDF** hóa đơn để gửi cho khách hàng.

### Bước 3: Ghi nhận thanh toán
- Sau khi khách trả tiền, bạn nhấn vào hóa đơn và chọn "Cập nhật thanh toán".

---

## 4. Quản lý Sự cố & Bảo trì (Incidents)
- Khi khách báo hỏng hóc, bạn vào mục **Incidents** tạo một sự cố mới.
- Hệ thống dạng bảng Kanban giúp bạn theo dõi việc nào Đang chờ, Đang sửa, hay Đã giải quyết.

---

## 5. Theo dõi Báo cáo (Dashboard)
- Giao diện **Dashboard** cung cấp bức tranh tổng quan: Tổng tiền thu trong tháng, tỷ lệ lấp đầy phòng, và các cảnh báo hóa đơn trễ hạn.

---

## 🌟 6. So sánh phiên bản (Free vs Premium)

RentFlow cung cấp hai gói dịch vụ phù hợp với quy mô quản lý của bạn:

| Tính năng | Gói FREE | Gói PREMIUM |
| :--- | :---: | :---: |
| **Quản lý Tòa nhà & Phòng** | Không giới hạn | Không giới hạn |
| **Quản lý Khách thuê & Hợp đồng** | Cơ bản | Chuyên sâu |
| **Quét CCCD bằng AI (OCR)** | ❌ Thủ công | ✅ Tự động điền |
| **Xác nhận Hợp đồng qua Scan** | ✅ Có | ✅ Có |
| **Tính toán Điện Nước & Hóa đơn** | ✅ Có | ✅ Có |
| **Báo cáo & Dashboard Tài chính** | ✅ Cơ bản | ✅ Chi tiết & Trực quan |
| **Quét chỉ số Điện Nước bằng AI** | ❌ Thủ công | 💎 Sắp ra mắt |
| **Hỗ trợ kỹ thuật** | Qua Email | Ưu tiên qua Zalo/Phone |

> [!TIP]
> **Tự động hóa với AI:** Tính năng quét CCCD giúp bạn tiết kiệm 90% thời gian nhập liệu và tránh sai sót thông tin khách thuê. Hãy nâng cấp lên Premium để trải nghiệm sự chuyên nghiệp vượt trội.

---


