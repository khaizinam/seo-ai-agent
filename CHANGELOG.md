# CHANGELOG

<div align="center">
  <a href="README.md">Trang chủ (README)</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="FEATURE.md">Tính năng (Features)</a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <b>Lịch sử Cập nhật (Changelog)</b>
</div>
<br/>

Tất cả các thay đổi đáng chú ý của dự án **SEOGEN AI** sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), 
và dự án áp dụng version hóa theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
