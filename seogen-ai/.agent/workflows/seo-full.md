# Workflow: SEO Full

Quy trình SEO đầy đủ từ nghiên cứu từ khóa đến xuất bản nội dung hoàn chỉnh.

## 🚀 Luồng công việc
1. **Nghiên cứu Từ khóa**: 
    - Sử dụng `campaign:aiSuggestKeywords` để lập danh sách.
    - Phân loại theo Intent (Informational, Transactional...).
2. **Lập Kế hoạch Nội dung**:
    - Sử dụng `campaign:generateContentPlan` để tạo danh sách bài viết theo tuần.
3. **Viết bài Wizard (Linear Flow)**:
    - **Step 1 (Brief)**: Xác định Audience và Summary.
    - **Step 2 (Outline)**: Tạo cấu trúc H2-H6.
    - **Step 3 (Content)**: Sinh nội dung theo Batch (Chunking).
    - **Step 4 (SEO Audit)**: Kiểm tra các tiêu chí kỹ thuật.
4. **Xuất bản**:
    - Gửi bài viết qua Webhook đến hệ thống CMS.

## 🤖 Khả năng của Agent
- Tự động hóa việc phân bổ từ khóa phụ.
- Tự động tạo Table of Contents.
- Đảm bảo tính nhất quán của giọng văn (Persona).
