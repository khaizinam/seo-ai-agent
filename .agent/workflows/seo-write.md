---
description: Viết bài SEO nhanh - lập dàn ý và xuất HTML CKEditor
---

# Viết bài SEO nhanh

1. Đọc file `.agent/skills/SEO-content.md` để nắm rules
2. Đọc các file mẫu trong `template/` (`en.txt`, `vi.txt`, `title.txt`, `social_content.txt`) để nắm định dạng đầu ra mong muốn.

## Quy trình:

### Bước 1: Nhận thông tin từ người dùng
- Từ khóa chính
- Chủ đề bài viết
- Đối tượng mục tiêu (nếu có)
- URL hình ảnh (nếu có)

### Bước 2: Tạo tiêu đề & meta (SONG NGỮ)
- Đề xuất 5 tiêu đề Tiếng Việt + 5 tiêu đề Tiếng Anh
- Đề xuất 3 meta description Tiếng Việt + 3 meta description Tiếng Anh

### Bước 3: Lập dàn ý
- Heading structure
- Mục lục

### Bước 4: Viết & xuất HTML CKEditor (SONG NGỮ)
- Viết nội dung Tiếng Việt theo template mẫu
- Viết nội dung Tiếng Anh (tự nhiên, không dịch máy)
- Tuân thủ tất cả hard rules
- Kiểm tra checklist + Bilingual checklist trước khi xuất

### Thứ tự xuất đầu ra:
**LƯU Ý QUAN TRỌNG:** Toàn bộ các file đầu ra PHẢI được lưu vào trong cùng một thư mục mới có đường dẫn: `contents/[slug_tieu_de_bai_viet]/` (tự động tạo thư mục này nếu chưa tồn tại).
1. `title.txt` (Tiêu đề + Meta Description Tiếng Việt & Tiếng Anh)
2. `vi.txt` (Bài viết HTML Tiếng Việt)
3. `en.txt` (Bài viết HTML Tiếng Anh)
4. `social_content.txt` (Facebook, LinkedIn, hashtag, link)