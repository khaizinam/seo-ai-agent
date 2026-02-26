---
description: Sửa và tối ưu bài viết theo chuẩn SEO và template HTML CKEditor
---

# Sửa bài viết SEO

1. Đọc file `.agent/skills/SEO-content.md` để nắm rules
2. Đọc các file mẫu trong `template/` (`en.txt`, `vi.txt`, `title.txt`, `social_content.txt`) để nắm định dạng đầu ra mong muốn.

## Quy trình:

### Bước 1: Nhận bài viết từ người dùng
- Nội dung bài viết cần sửa
- Từ khóa mục tiêu

### Bước 2: Phân tích bài viết hiện tại
- Kiểm tra cấu trúc HTML
- Kiểm tra heading hierarchy
- Kiểm tra mật độ từ khóa
- Kiểm tra internal links
- Kiểm tra hình ảnh (alt, figcaption, lazy loading)

### Bước 3: Sửa và tối ưu
- Sửa HTML theo template chuẩn
- Thêm/sửa heading structure
- Thêm/sửa mục lục
- Tối ưu từ khóa
- Thêm FAQ nếu thiếu

### Bước 4: Xuất bài viết đã sửa (SONG NGỮ)
**LƯU Ý QUAN TRỌNG:** Toàn bộ các file đầu ra PHẢI được lưu vào trong cùng một thư mục mới có đường dẫn: `contents/[slug_tieu_de_bai_viet]/` (tự động tạo thư mục này nếu chưa tồn tại).
- Xuất file `title.txt` (Tiêu đề + Meta Description Tiếng Việt và Tiếng Anh)
- Xuất file `vi.txt` (HTML CKEditor hoàn chỉnh Tiếng Việt)
- Xuất file `en.txt` (HTML CKEditor hoàn chỉnh Tiếng Anh)
- Xuất file `social_content.txt` (Content FB/LinkedIn ngắn + hashtag + link)
- Xuất file `image_prompt.txt` (Kịch bản tạo hình ảnh AI kiểu tranh vẽ hoạt hoạ)
- Liệt kê các thay đổi đã thực hiện
- Chạy checklist cuối cùng + Bilingual checklist
