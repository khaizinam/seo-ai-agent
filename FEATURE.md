# Tính năng của SEOGEN AI

SEOGEN AI tích hợp nhiều tính năng mạnh mẽ để quản lý quy trình sáng tạo nội dung và SEO tự động hóa:

### 🗄️ Hỗ trợ kết nối Đa dạng Cơ sở dữ liệu
Ứng dụng có thể kết nối với nhiều hệ quản trị cơ sở dữ liệu phổ biến, giúp lưu trữ trực tiếp vào hệ thống của bạn:
- **MySQL / MariaDB**
- **PostgreSQL**
- **SQLite**

### ✍️ Quản lý Giọng văn & Nhân vật (Persona)
Tạo ra các biên tập viên / nhân vật AI sống động với các thiết lập chi tiết về:
- Phong cách viết (Writing Style).
- Giọng điệu (Tone of Voice).
- Đoạn văn mẫu (Example Text).
AI sẽ viết bài hoàn toàn khớp với ngữ cảnh hướng đối tượng mà bạn đề ra.

### 📅 Chiến dịch & Lập kế hoạch theo Từ khoá
- Tạo hàng loạt các Chiến dịch đa dạng (Campaigns).
- Bóc tách chủ đề thành một danh sách Từ khoá (Keywords) phục vụ cho kế hoạch viết nhiều bài.
- Theo dõi tiến độ tuần tự, kết hợp với các Meta Status / Data.

### 📄 Sinh Bài viết Chuẩn SEO
Cơ chế tự động hóa thông minh theo quy trình (AI Agent Workflow):
- Sinh trực tiếp mã `HTML` sạch chuẩn cấu trúc thẻ (H2 - H6).
- Tích hợp **Keyword** vào mật độ văn bản.
- Sinh tự động **Meta Title** & **Meta Description** chuẩn SEO dựa trên bài viết và Rule.
- Tự động sinh nội dung đăng mạng xã hội (Facebook, LinkedIn).
- Tự động tạo Prompt bằng Tiếng anh cho **Thumbnail** AI (Midjourney/DALL-E).

### 🤖 Webhooks
- Giao thức tích hợp mạnh mẽ giúp bắn nội dung được sinh tự động thông qua API POST/PUT... tới các hệ thống CMS như WordPress, Webflow, hoặc nền tảng tùy chỉnh.
- Hỗ trợ Dynamic Mapping (Mapping Header & Body linh hoạt với dữ liệu động từ bài viết như Tiếng Anh/Tiếng Việt/Trạng thái/Metadata).

### ♻️ Tính năng AI Agent tự động (Auto-Rotate Model)
- Gắn liền tính năng **Fallback / Retry**: Khi API của mô hình AI hiện tại (VD: Gemini 2.0 Flash) gặp lỗi vượt giới hạn (Rate Limit Exceeded).
- Con Agent AI sẽ tự động xoay model (Rotate Model) nhảy sang các model phụ khác (VD: Gemini 1.5 Pro) để thử lại quá trình sinh văn bản mà không bị gián đoạn hay bắt người dùng phải trực tiếp ấn lại.

### 🖼️ Xử lý, Chuyển đổi & Nén ảnh
Công cụ tối ưu hóa hình ảnh Built-in sức mạnh từ Sharp:
- Nén dung lượng (Giảm Size ảnh) mà vẫn siêu nét.
- Chuyển đổi định dạng từ `JPG/PNG` sang `WebP` (định dạng ảnh tối ưu nhất dành cho SEO Web).
- Giữ nguyên cấu trúc/giải phóng rác ảnh.

### 🧹 Clear Cache & Quản trị Hệ thống
- Tự động hóa xóa dữ liệu liên đới (Cascade Delete) loại bỏ đi các Thumbnail/Meta Database không cần dùng.
- Clead Cache ứng dụng hoặc phục hồi cấu hình ban đầu.
- Giao diện Dark mode / Light mode siêu mượt.
- Hỗ trợ Offline Database.
