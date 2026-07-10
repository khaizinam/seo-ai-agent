# CHANGELOG

<div align="center">
  <a href="README.md">Trang chủ (README)</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="FEATURE.md">Tính năng (Features)</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <b>Lịch sử Cập nhật (Changelog)</b> &nbsp;&nbsp;|&nbsp;&nbsp;
</div>
<br/>

Tất cả các thay đổi đáng chú ý của dự án **SEOGEN AI** sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), 
và dự án áp dụng version hóa theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - Cập nhật Tính năng Tiện ích & Đồng bộ nâng cao (2026-07-10)

Mọi người có thể vào xem và tải các phiên bản build tại link Google Drive này để trải nghiệm:
👉 **[Google Drive Link Tải Bản Cài Đặt](https://drive.google.com/drive/folders/1dXInIk-2qv6ieoex5zGUpA-Ufahw_ryo?usp=sharing)**

### ✨ Thêm mới (Added)
- **Đồng bộ cấu hình Lên/Về Cloud (Settings Sync Profiles)**:
  - Khởi tạo bảng `app_configs` lưu trữ cấu hình trên Cloud Database.
  - Cho phép người dùng lưu trữ (Upload) cấu hình cài đặt cá nhân (AI Keys, theme, language, persona mặc định...) lên Cloud DB dưới dạng tên cấu hình tùy chọn (hỏi tạo cấu hình mới hoặc chọn ghi đè lên cấu hình đang có).
  - Cho phép người dùng tải xuống (Download) cấu hình từ Cloud DB về máy cá nhân khi đi nhiều máy tính khác nhau, giúp đồng bộ cài đặt chỉ với 1 click.
- **Giám sát số lượng Request & Thời gian hết Quota**:
  - Tích hợp bộ đếm `reqCount` tự động tăng sau mỗi lần request thành công đến một AI Profile bất kỳ.
  - Tự động bắt lỗi API và ghi nhận chính xác mốc thời gian hết hạn ngạch `exhaustedAt` (Ngày và giờ cụ thể) của từng API Key/Model.
  - Hiển thị trực quan trạng thái Quota (🟢 Hoạt động tốt / ⚠️ Hết Quota lúc [Thời gian]) trong bảng quản lý AI Providers.
  - Thêm nút Reset riêng lẻ kế bên mỗi AI Profile giúp người dùng khôi phục bộ đếm và trạng thái Quota cho riêng Model đó.
- **Đồng bộ Dữ liệu CSDL (Data Sync)**:
  - Bổ sung nút "Đồng bộ lên Cloud" (Push SQLite → Cloud) và "Đồng bộ xuống SQLite" (Pull Cloud → SQLite) khi kết nối với MySQL, PostgreSQL, MariaDB kèm thông báo cảnh báo bảo mật tránh mất mát dữ liệu.
- **Sao lưu cài đặt bằng tệp JSON (Export/Import Local Settings)**:
  - Bổ sung nút xuất (Export) và nhập (Import) tệp cấu hình JSON chứa toàn bộ cài đặt ứng dụng bao gồm API key chưa mã hóa tại tab **Nâng cao** để dễ dàng mang đi mọi nơi.

### 🛠️ Thay đổi (Changed)
- **Bỏ chức năng Tạo mục lục (Table of Contents)**:
  - Loại bỏ các phần liên quan đến việc tạo mục lục bài viết khỏi prompt của AI (cả Frontend và Backend) do website bên ngoài sẽ tự động đảm nhiệm việc này.
  - Cập nhật tài liệu kỹ năng `.agent` và các workflow liên quan (`seo-fix`, `seo-full`, `seo-write`).
- **Khôi phục mật khẩu kết nối Database**:
  - Ghi nhớ và nạp lại mật khẩu cũ của các kết nối cơ sở dữ liệu trước đó từ lịch sử kết nối của từng loại DB (SQLite, MySQL, Postgres, MariaDB) khi người dùng chuyển đổi qua lại giữa các tab DB.
- **Tích hợp Native SQLite làm CSDL mặc định**:
  - Thay thế cấu hình ban đầu bằng SQLite giúp người dùng không có kiến thức kỹ thuật có thể mở ứng dụng là sử dụng được ngay mà không cần tạo DB.

---

## [1.0.0] - Phát hành Đầu tiên (Initial Release)

### ✨ Thêm mới (Added)
- **Quy trình Sinh bài viết (Article Generation)**: Tích hợp đầy đủ AI Pipeline phục vụ tạo mã HTML chuẩn thẻ, thẻ Meta Title/Description, Nội dung Social tự động (Facebook/LinkedIn) và prompt cho hệ thống AI Thumbnail.
- **Hỗ trợ Đa nền tảng CSDL**: Kết nối mượt mà tới các hệ thống Database như MySQL, MariaDB, PostgreSQL, SQLite phục vụ thiết lập linh hoạt.
- **AI Tự động Xoay (Auto-Rotate AI Models)**: Tự động nhảy sang model AI thay thế mỗi khi Rate Limit của model hiện tại bị giới hạn từ API Server. Hỗ trợ đầy đủ các model xịn từ OpenAI (GPT-4), Anthropic (Claude Opus, Sonnet) & Google Gemini 1.5, 2.0.
- **Tuỳ chỉnh Giọng văn (Persona Management)**: Hỗ trợ xây dựng cấu trúc nhân vật viết, ngữ cảnh (Tone), mẫu câu linh động ánh xạ cho từng chiến dịch/từ khoá.
- **Chiến dịch từ khoá (Campaigns)**: Nhóm & quản lý trực quan danh sách hàng trăm từ khoá phục vụ lên bài dài hạn. Hỗ trợ import/export số liệu.
- **Webhooks**: Khởi tạo và bắn Data Payload (JSON/Form) kèm Mapping Token cực kỳ mạnh mẽ sang các nền tảng CMS/Wordpress/WebFlow linh hoạt.
- **Built-in Nén & Chuyển đổi Hình ảnh (Image Converter)**: Khả năng scale hệ thống ảnh hàng loạt, đổi định dạng sang chuẩn `WebP` để load page nhanh nhất có thể cho điểm page speed xanh. Tối ưu bằng *sharp*.
- **Xử lý Rác Thông minh (Cascade Delete)**: Quản lý bộ nhớ ứng dụng tối ưu khi Xóa một Bài viết, hệ thống dọn dẹp liên hoàn Image/Thumbnail Files cùng Database Meta rác đi kèm giúp CSDL cực kì gọn nhẹ.
- **Bảng điểu khiển Hiện đại (Dashboard)**: Tích hợp Quick Actions Start, hiển thị thông số Campaign/Score theo thời gian thực và widget Intro chi tiết.
- Cài đặt phím tắt/cấu hình API linh động cùng giao diện **Glassmorphism/Dark Mode** chuẩn hiện đại tương thích 2 nền tảng Windows + MacOS.
