# 🎬 UIT FILM — Website Xem & Cập Nhật Phim

> Phiên bản nâng cấp cá nhân từ đồ án nhóm [IE104.Q11.CNVN.Group2]  
> Phát triển bởi **Nguyễn Phước Thịnh** — MSSV: 23521505

---

## Giới thiệu

**UIT FILM** là website xem và cập nhật phim được nâng cấp từ đồ án môn IE104 (Phát triển ứng dụng Web) tại Trường Đại học Công nghệ Thông tin — ĐHQG-HCM.

So với phiên bản gốc chỉ giới thiệu và đánh giá phim, phiên bản này được nâng cấp với các cải tiến lớn:

- ✅ **Xem phim trực tiếp** ngay trên website (thay vì chỉ xem thông tin & trailer)
- ✅ **Tích hợp API mới** từ [KKPhim](https://kkphim.com/) — nguồn dữ liệu phim phong phú, cập nhật liên tục
- ✅ Giữ nguyên đầy đủ các tính năng quản lý, tài khoản người dùng từ phiên bản gốc

---

## Tính năng

### Người dùng chưa đăng nhập

| Tính năng | Trạng thái |
|---|---|
| Đăng ký tài khoản | ✅ |
| Đăng nhập | ✅ |
| Quên mật khẩu | ✅ |
| Tìm kiếm phim | ✅ |
| Xem danh sách phim | ✅ |
| Xem chi tiết phim | ✅ |
| Xem chi tiết diễn viên | ✅ |
| Đề xuất phim hot | ✅ |
| Đề xuất phim tương tự | ✅ |
| **Xem phim trực tiếp** *(nâng cấp mới)* | ✅ |
| Sử dụng bộ lọc | ✅ |

### Người dùng đã đăng nhập

| Tính năng | Trạng thái |
|---|---|
| Xem / Sửa thông tin cá nhân | ✅ |
| Đổi mật khẩu | ✅ |
| Xem thông báo | ✅ |
| Đánh giá phim | ✅ |
| Thêm / Xem phim yêu thích | ✅ |
| Đăng xuất | ✅ |

### Admin

| Tính năng | Trạng thái |
|---|---|
| Quản lý người dùng (thêm / sửa / xóa) | ✅ |

---

## Thay đổi so với phiên bản gốc

| | Phiên bản gốc (Nhóm 2) | Phiên bản nâng cấp |
|---|---|---|
| Chức năng chính | Giới thiệu & đánh giá phim | **Xem phim + giới thiệu + đánh giá** |
| Nguồn dữ liệu phim | TMDb API | **KKPhim API (kkphim.com)** |
| Xem trailer | Chưa hoàn thiện | ✅ Hoàn thiện |
| Bộ lọc phim | Chưa hoàn thiện | ✅ Hoàn thiện |

---

## Công nghệ sử dụng

- **Node.js** — Xử lý back-end, API
- **Express.js** — Framework web server
- **MongoDB** — Cơ sở dữ liệu NoSQL
- **HTML / CSS / JavaScript** — Giao diện người dùng
- **KKPhim API** — Nguồn dữ liệu phim: [https://kkphim.com/](https://kkphim.com/)

---

## Cài đặt & Chạy

### Bước 1. Clone repository

```bash
git clone <your-repo-url>
cd <your-repo-name>/server
```

### Bước 2. Tạo file `.env` trong thư mục `server`

```env
SECRET_JWT=your_jwt_secret
PORT=5000
DB_URL=your_mongodb_connection_string
DATABASE_NAME=MovieWeb
KKPHIM_API=https://kkphim.com/api
```

> Không commit file `.env` lên GitHub.

### Bước 3. Cài đặt dependencies

```bash
cd server
npm install bcrypt bcryptjs cors dotenv express jsonwebtoken mongodb mongoose nodemailer
npm install -D nodemon
```

### Bước 4. Chạy server

```bash
npm start
```

Server mặc định chạy tại: `http://localhost:5000`

### Bước 5. Mở giao diện

Mở file `client/view/pages/homepage` trong trình duyệt, hoặc truy cập link deploy (nếu có).

---

## Nguồn gốc dự án

Dự án này được fork và nâng cấp từ đồ án nhóm:

- **Repository gốc:** [dtam2812/IE104---Movie-Database-and-Updates-Website](https://github.com/dtam2812/IE104---Movie-Database-and-Updates-Website)
- **Môn học:** IE104 — Phát triển ứng dụng Web
- **Trường:** Đại học Công nghệ Thông tin, ĐHQG-HCM

---

## Tác giả

**Nguyễn Phước Thịnh**  
MSSV: 23521505  
Trường Đại học Công nghệ Thông tin — ĐHQG-HCM