# 🤖 SEOGEN AI Agent Memory

Thư mục này chứa toàn bộ kiến thức, cấu trúc và quy trình của dự án SEOGEN AI để hỗ trợ các phiên làm việc tiếp theo của AI Agent.

## 📂 Cấu trúc bộ nhớ
- **[Skills](./skills/)**: Danh sách các năng năng xử lý AI (Prompt, Logic).
- **[Structure](./structure/)**: Sơ đồ cấu trúc folder, file và vai trò từng thành phần.
- **[Workflows](./workflows/)**: Các quy trình làm việc chuẩn cho từng tác vụ SEO.

---

## 🎯 Mục đích dự án
Hệ thống tự động hóa sản xuất nội dung SEO chất lượng cao, sử dụng cơ chế **Chunking** (chia nhỏ bài viết) để tối ưu hóa context và tránh hiện tượng AI lười biếng.

## 🛠 Cấu hình quan trọng
- **Router**: Nằm tại `src/App.tsx`.
- **Database**: Cấu hình tại `electron/services/db/knex.service.ts`.
- **AI Core**: Toàn bộ prompt tập trung tại `src/lib/prompts.ts`.

---

## 🚦 Luồng hoạt động chính (User Journey)
1. Cấu hình DB & AI API Key.
2. Tạo Chiến dịch & Nghiên cứu Từ khóa.
3. Lập kế hoạch nội dung tổng thể.
4. Sử dụng Wizard 4 bước để viết bài chi tiết.
5. Kiểm duyệt và đẩy bài qua Webhook.

---

## 🔄 Quy tắc cập nhật bộ nhớ (Memory Maintenance)
Để đảm bảo AI Agent luôn nắm bắt được các thay đổi mới nhất, cần tuân thủ:
- **Cập nhật ngay**: Khi có thay đổi về logic Prompt (Skills), cấu trúc Folder (Structure), hoặc quy trình làm việc (Workflows).
- **Thời điểm**: Có thể thực hiện **trước khi bắt đầu task** (để lập kế hoạch) hoặc **ngay sau khi hoàn thành task** (để ghi nhớ kết quả).
- **Nội dung**: Phải phản ánh đúng trạng thái thực tế của code hiện tại.
