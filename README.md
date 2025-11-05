# Caro Legends - Game Cờ Caro (Gomoku) Online Realtime

Đây là một dự án game cờ caro online thời gian thực được xây dựng để đáp ứng các yêu cầu kỹ thuật chi tiết. Game hỗ trợ chế độ chơi người với người (Player vs Player) thông qua mạng và chơi với máy (Player vs Environment/AI).

## Tính năng nổi bật

- **Chơi Online 2 người:** Tạo phòng, mời bạn bè qua mã phòng và thi đấu thời gian thực.
- **Chơi Offline:**
    - **Chơi 2 người trên cùng máy (Hotseat).**
    - **Chơi với AI:** Luyện tập với AI "siêu cấp" sử dụng thuật toán Minimax và Alpha-Beta Pruning.
- **Bàn cờ "vô hạn":** Bàn cờ không giới hạn kích thước, người chơi có thể tự do sáng tạo chiến thuật.
- **Tương tác mượt mà:** Hỗ trợ kéo (pan), phóng to/thu nhỏ (zoom) trên bàn cờ bằng chuột và cảm ứng.
- **Hệ thống Skin:** Người chơi có thể chọn skin cho quân cờ X và O.
- **Giao diện hiện đại:** UI được xây dựng bằng React, TypeScript và Tailwind CSS, responsive.
- **Kiến trúc Client-Server:** Logic game được xử lý ở phía server (Node.js) để đảm bảo tính toàn vẹn và chống gian lận.

## Công nghệ sử dụng

- **Frontend:**
  - React 18
  - TypeScript
  - Tailwind CSS (qua CDN)
  - Vite
- **Backend:**
  - Node.js
  - Express
  - Socket.io
- **Ngôn ngữ:** TypeScript (Frontend), JavaScript (Backend)

---

## Hướng dẫn Deploy Lên Mạng (Để Chơi Online)

Để bạn bè và mọi người có thể chơi game của bạn, chúng ta cần đưa cả backend và frontend lên các dịch vụ hosting. Hướng dẫn này sẽ sử dụng các nền tảng miễn phí phổ biến.

### Bước 0: Chuẩn bị - Đưa mã nguồn lên GitHub

Nếu bạn chưa làm, đây là bước bắt buộc. Các nền tảng hosting sẽ kết nối với tài khoản GitHub của bạn để lấy mã nguồn.

1.  **Tạo tài khoản GitHub:** Truy cập [GitHub.com](https://github.com/) và đăng ký.
2.  **Tạo Repository mới:** Trên GitHub, tạo một repository mới (ví dụ: `caro-legends-online`).
3.  **Tải mã nguồn lên:** Mở terminal ở thư mục dự án của bạn và chạy các lệnh sau (thay `YOUR_GITHUB_USERNAME` và `YOUR_REPOSITORY_NAME` bằng thông tin của bạn):
    ```bash
    git init -b main
    git add .
    git commit -m "Initial commit: Ready for deployment"
    git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
    git push -u origin main
    ```

### Phần 1: Deploy Backend lên Render.com

Backend (server.js) cần chạy liên tục để xử lý logic game. Render là lựa chọn tuyệt vời vì miễn phí, dễ sử dụng và hỗ trợ tốt Socket.IO.

1.  **Đăng ký tài khoản:** Truy cập [Render.com](https://render.com/) và đăng ký tài khoản (nên dùng tài khoản GitHub để liên kết cho tiện).
2.  **Tạo "New Web Service":**
    *   Trên trang Dashboard, nhấn vào `New +` -> `Web Service`.
    *   Chọn "Build and deploy from a Git repository" và kết nối với tài khoản GitHub của bạn.
    *   Chọn repository `caro-legends-online` mà bạn vừa tạo.
3.  **Cấu hình dịch vụ:**
    *   **Name:** Đặt tên cho project (ví dụ: `caro-minc-server`). Render sẽ tạo cho bạn một URL dạng `https-ten-project.onrender.com`.
    *   **Region:** Chọn `Singapore (Southeast Asia)` cho tốc độ tốt nhất ở Việt Nam.
    *   **Branch:** `main`.
    *   **Root Directory:** Để trống.
    *   **Runtime:** `Node`.
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
    *   **Instance Type:** Chọn `Free`.
4.  **Deploy:** Nhấn `Create Web Service`. Render sẽ tự động cài đặt dependencies và khởi động server. Quá trình này có thể mất vài phút.
5.  **Lấy URL Backend:** Sau khi deploy thành công, bạn sẽ thấy một URL ở đầu trang, ví dụ: `https://caro-minc-server.onrender.com`. **URL này CỰC KỲ QUAN TRỌNG**, hãy sao chép nó để dùng ở bước tiếp theo.

> **Lưu ý:** Gói miễn phí của Render sẽ "ngủ" sau 15 phút không có ai truy cập. Lần kết nối đầu tiên sau khi ngủ có thể mất khoảng 30 giây để server "thức dậy".

### Phần 2: Deploy Frontend lên Vercel.com

Frontend là giao diện người dùng, Vercel là nền tảng tốt nhất để host các ứng dụng React/Vite.

1.  **Đăng ký tài khoản:** Truy cập [Vercel.com](https://vercel.com/) và đăng ký bằng tài khoản GitHub của bạn.
2.  **Import Project:**
    *   Trên dashboard, chọn `Add New...` -> `Project`.
    *   Chọn repository `caro-legends-online` từ danh sách.
3.  **Cấu hình Project:**
    *   Vercel sẽ tự động nhận diện đây là một dự án `Vite`. Các cài đặt `Build and Output Settings` thường là chính xác, bạn không cần thay đổi.
    *   **Quan trọng nhất: Thêm Environment Variables (Biến môi trường):**
        *   Mở mục `Environment Variables`.
        *   Thêm một biến mới:
            *   **Name:** `VITE_SERVER_URL`
            *   **Value:** Dán cái URL backend bạn đã sao chép từ **Render** vào đây (ví dụ: `https://caro-minc-server.onrender.com`).
4.  **Deploy:** Nhấn nút `Deploy`. Vercel sẽ build và triển khai ứng dụng của bạn. Quá trình này rất nhanh.

### Hoàn tất!

Sau khi Vercel deploy xong, bạn sẽ có một đường link (ví dụ: `https://caro-legends-online.vercel.app`). **Đây chính là link game của bạn!** Hãy gửi nó cho bạn bè, mở trên nhiều trình duyệt và tận hưởng thành quả!

### Khắc phục sự cố thường gặp
- **Game không kết nối được (cứ báo "Đang kết nối..."):**
  1. Kiểm tra lại giá trị của biến `VITE_SERVER_URL` trên Vercel, đảm bảo nó chính xác là URL của server trên Render và không có ký tự thừa.
  2. Vào trang quản lý của Render, xem log của server có báo lỗi gì không.
- **Vào game bị lỗi `Cannot GET /`:** Điều này xảy ra khi bạn truy cập trực tiếp vào URL của backend. Game chỉ có thể chơi được từ URL của frontend (trên Vercel).

Chúc bạn thành công và có những ván cờ vui vẻ!