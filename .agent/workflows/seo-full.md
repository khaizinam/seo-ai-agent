---
description: Quy trình SEO đầy đủ - từ nghiên cứu từ khóa đến xuất bài viết HTML CKEditor
---

# Quy trình SEO Full Pipeline

Đọc skill SEO trước khi bắt đầu:

1. Đọc file `.agent/skills/SEO-content.md` để nắm rules
2. Đọc các file mẫu trong `template/` (`en.txt`, `vi.txt`, `title.txt`, `social_content.txt`) để nắm định dạng đầu ra mong muốn.

## Các bước thực hiện:

### Bước 1: Nghiên cứu từ khóa
- Thu thập từ khóa chính, phụ, LSI
- Phân tích search intent
- Nhóm topic cluster

### Bước 2: Phân tích đối thủ
- Tìm top 5-10 đối thủ
- Content gap analysis
- Đề xuất chiến lược vượt đối thủ

### Bước 3: Tạo tiêu đề & meta description
- Đề xuất 5-10 tiêu đề
- Đề xuất 3-5 meta description
- Người dùng chọn phương án tốt nhất

### Bước 4: Lập dàn ý bài viết
- Heading structure (H3→H6)
- Nội dung tóm tắt từng phần
- Mục lục với anchor links

### Bước 5: Viết bài viết
- Viết nội dung theo dàn ý
- Xuất HTML CKEditor **Tiếng Việt**
- Xuất HTML CKEditor **Tiếng Anh** (viết tự nhiên, không dịch máy)
- Kiểm tra checklist SEO + HTML + Song ngữ

### Bước 6: Kiểm tra & tối ưu
- Chạy checklist cuối cùng (bao gồm Bilingual Checklist)
- Sửa lỗi nếu có
- Xuất bản

### Thứ tự xuất đầu ra cuối cùng:
**LƯU Ý QUAN TRỌNG:** Toàn bộ các file đầu ra PHẢI được lưu vào trong cùng một thư mục mới có đường dẫn: `contents/[slug_tieu_de_bai_viet]/` (tự động tạo thư mục này nếu chưa tồn tại).
1. `title.txt` (Tiêu đề + Meta Description Tiếng Việt & Tiếng Anh)
2. `vi.txt` (Bài viết HTML Tiếng Việt)
3. `en.txt` (Bài viết HTML Tiếng Anh)
4. `social_content.txt` (Facebook & LinkedIn kèm hashtag, link)
5. `image_prompt.txt` (Kịch bản tạo hình ảnh AI kiểu tranh hoạt hoạ)
