# Hướng dẫn chạy và build SEOGEN AI bằng Docker

Tệp này cung cấp thông tin và hướng dẫn giả lập môi trường Node.js đầy đủ dùng Docker để xây dựng (build) và đóng gói ứng dụng **SEOGEN AI** (bao gồm việc build file `.exe` cho Windows từ Linux).

---

## 📋 Yêu cầu cấu hình Docker cần có
Để đảm bảo Docker chạy mượt mà ứng dụng Electron, cấu hình Docker cần giải quyết 3 vấn đề lớn:
1.  **Biên dịch native C++ modules**: Gói `sqlite3` và `sharp` chứa mã nguồn C++ cần các công cụ `gcc`, `g++`, `make`, `python3` để tự build lại (`electron-rebuild`) trên môi trường Linux của Docker.
2.  **Đóng gói file cài đặt cho Windows (`.exe`)**: `electron-builder` yêu cầu bộ thư viện giả lập **Wine (Wine32)** và **Mono** để compile/đóng gói NSIS installer của Windows trên môi trường Linux.
3.  **Chạy thử nghiệm hiển thị (GUI Desktop)**: Electron yêu cầu các thư viện hệ thống X11 (`libgtk`, `libnss3`, `libasound2`,...) và công cụ hiển thị ảo **Xvfb (X Virtual Framebuffer)** để khởi động các tiến trình đồ họa mà không cần cắm màn hình vật lý.

Tất cả các thành phần này đã được tự động tích hợp trong [Dockerfile](file:///c:/myfiles/sources/seo-ai-agent/seogen-ai/Dockerfile).

---

## 🚀 Hướng dẫn thực hiện

### 1. Build Docker Image & Chạy Đóng gói ứng dụng (Build .exe)
Để tự động tải về, cài đặt dependencies, rebuild các thư viện native và đóng gói file chạy `.exe` cho Windows:
```bash
docker compose up --build
```
*   **Kết quả**: Tệp tin cài đặt `.exe` và phiên bản chạy trực tiếp của Windows sẽ được tạo ra tại thư mục [dist-release](file:///c:/myfiles/sources/seo-ai-agent/seogen-ai/dist-release) ngay trên máy tính của bạn.
*   **Điểm lưu ý**: Docker-compose đã được cấu hình anonymous volume `- /app/node_modules` nhằm ngăn chặn việc thư mục `node_modules` của máy Windows ghi đè lên các native module đã compile của Linux trong Docker, giúp quá trình build không bị lỗi.

### 2. Chạy ứng dụng dưới chế độ Phát triển (Dev Mode) bằng Docker
Nếu bạn muốn chạy thử nghiệm môi trường Dev hoặc debug ứng dụng thông qua Docker:
```bash
docker compose run --rm seogen-builder yarn dev
```

---

## 🛠️ Chi tiết các tệp tin cấu hình đã tạo
*   **[Dockerfile](file:///c:/myfiles/sources/seo-ai-agent/seogen-ai/Dockerfile)**: Base image chạy Node.js v20, cài đặt sẵn Wine/Mono, X11 libraries, các công cụ build C++ (`build-essential`) và tự động chạy `yarn install`.
*   **[docker-compose.yml](file:///c:/myfiles/sources/seo-ai-agent/seogen-ai/docker-compose.yml)**: Quản lý volume cache cho Electron/Builder để tăng tốc độ download các gói chạy Electron, bảo vệ thư mục `node_modules` riêng biệt và ánh xạ thư mục output về máy chủ host.
