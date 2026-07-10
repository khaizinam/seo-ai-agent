# Sử dụng base image Node LTS trên nền Debian/Ubuntu
FROM node:20-bookworm-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Đặt biến môi trường để chạy cài đặt không cần tương tác (non-interactive)
ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt các thư viện cần thiết cho việc biên dịch native C++ modules (sqlite3, sharp),
# chạy Wine/Mono (để đóng gói file .exe cho Windows từ Linux) và chạy Electron GUI (X11/Xvfb)
RUN dpkg --add-architecture i386 && \
    apt-get update && apt-get install -y --no-install-recommends \
    # Toolchain biên dịch native modules C++
    build-essential \
    python3 \
    make \
    g++ \
    git \
    # Wine & Mono để electron-builder đóng gói NSIS .exe trên Linux
    wine \
    wine32 \
    mono-devel \
    ca-certificates \
    # Các thư viện GUI cần thiết để chạy Electron và môi trường Xvfb (Virtual Framebuffer)
    xvfb \
    libasound2 \
    libgbm1 \
    libgconf-2-4 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libxtst6 \
    libx11-xcb1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Sao chép package.json và yarn.lock trước để tận dụng cache lớp (layer cache) của Docker
COPY package.json yarn.lock ./

# Cài đặt dependencies (tự động biên dịch native C++ binaries của sqlite3 và sharp cho môi trường Linux của Docker)
RUN yarn install --frozen-lockfile

# Sao chép toàn bộ mã nguồn của dự án vào container
COPY . .

# Thiết lập bộ nhớ cache cho Electron và Electron-builder
ENV ELECTRON_CACHE="/root/.cache/electron"
ENV ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder"

# Port mặc định khi chạy Vite dev server
EXPOSE 5173

# Lệnh mặc định: Build dự án
CMD ["yarn", "build"]
