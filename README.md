# [IE104.Q11.CNVN.Group2]--- ĐỒ ÁN XÂY DỰNG WEBSITE GIỚI THIỆU VÀ CẬP NHẬT PHIM UIT FILM.

* Trường Đại học Công nghệ Thông tin, Đại học Quốc gia Thành phố Hồ Chí Minh (ĐHQG-HCM)
* Khoa: Khoa học và Kỹ thuật thông tin (KH&KTTT)
* GVHD: ThS. Võ Tấn Khoa
* Nhóm sinh viên thực hiện: Nhóm 2

## Danh sách thành viên
|STT | Họ tên | MSSV|Chức vụ|
|:---:|:-------------:|:-----:|:-----:|
|1. 	| Đinh Nguyễn Đức Tâm | 23521384| Nhóm trưởng |
|2. 	| Trần Thành Vinh		| 23521799 | Thành viên |
|3. 	| Đỗ Tấn Tường		|	23521749| Thành viên |
|4.  | Nguyễn Phước Thịnh | 23521505| Thành viên |
|5. 	| Đào Minh Thiện | 23521477| Thành viên |

## Giới thiệu
Trong thời buổi ngày nay, rất nhiều phim điện ảnh hay phim bộ được ra đời rất nhiều. Song Song với đó việc chọn được 1 bộ phim hay và ưng ý với mỗi người rất khó.

Vì vậy, nhóm quyết định chọn đề tài "Xây dựng website giới thiệu và cập nhật phim UIT FILM"

## Tính năng
|Tên tác nhân |	Mô tả tác nhân|
|:-------------:|:-----:|
|Unauthenticated User (Người dùng chưa xác thực) |	Người dùng chưa có tài khoản hoặc có tài khoản nhưng chưa đăng nhập. Người dùng này được quyền sử dụng các chức năng công khai của hệ thống.|
|Authenticated User (Người dùng đã xác thực) |	Người dùng có tài khoản và đã đăng nhập, có một số quyền hạn sử dụng trong hệ thống.|
|Admin | Là người dùng có quyền hạn cao nhất trong hệ thống. Quản trị viên có thể quản lý người dùng, quản lý thông tin phim, xem và cập nhật phim, cấu hình hệ thống và xem các báo cáo. Quản trị viên đảm bảo hoạt động chung của hệ thống, bảo mật, và có quyền cấp phép và phân quyền cho các tài khoản khác trong hệ thống.|

|	Tên chức năng	|	Tác nhân	| Hoàn thành |
|:-------------:|:-----:|:-----:|
||	1.Unauthenticated User Module	(Mô-đun Người dùng chưa xác thực)                   	||
|	Đăng ký tài khoản người dùng	|	Unauthenticated User 	| 100%|
|	Đăng nhập người dùng 	|	Unauthenticated User	| 100%|
|	Quên mật khẩu	|	Unauthenticated User 	| 100%|
|	Tìm kiếm phim	|	Unauthenticated User 	| 100%|
|	Xem danh sách phim	|	Unauthenticated User 	| 100%|
|	Xem chi tiết phim	|	Unauthenticated User 	| 100%|
|	Xem chi tiết diễn viên và phim diễn viên đó đã tham gia	|	Unauthenticated User 	| 100%|
|	Đề xuất phim hot	|	Unauthenticated User 	| 100%|
|	Đề xuất phim tương tự	|	Unauthenticated User 	| 100%|
|	Sử dụng bộ lọc	|	Unauthenticated User	| 0%|
|	Xem Trailer	|	Unauthenticated User	| 0%|
||	2.Authenticated User Module	 (Mô-đun Người dùng đã xác thực)                        	||
|	Xem thông tin cá nhân	|	Authentication User	| 100%|
|	Sửa thông tin cá nhân	|	Authentication User	| 100%|
|	Xem thông báo	|	Authentication User	| 100%|
|	Đổi mật khẩu	|	Authentication User	| 100%|
|	Đăng xuất	|	Authentication User	| 100%|
|	Đánh giá	|	Customer	| 100%|
|	Thêm phim yêu thích vào mục yêu thích	|	Customer	| 100%|
|	Xem lại phim yêu thích vào mục yêu thích	|	Customer	| 100%|
||	3.Admin Module (Mô-đun Quản trị viên)                   ||
|	Quản lý phim	|	Admin	| 100%|
|	Thêm phim	|	Admin	| 100%|
|	Xóa phim	|	Admin	| 100%|
|	Sửa thông tin phim	|	Admin	| 100%|
|	Quản lý người dùng	|	Admin	| 100%|
|	Thêm người dùng	|	Admin	| 100%|
|	Xóa người dùng	|	Admin	| 100%|
|	Sửa thông tin người dùng	|	Admin	| 100%|



## Công nghệ sử dụng
* [Node.js] - Xử lý API, Back-end
* [Express] - Framework nằm trên chức năng máy chủ web của NodeJS
* [MongoDB] - Hệ quản trị cơ sở dữ liệu quan hệ sử dụng để lưu trữ dữ liệu cho trang web
* [HTML-CSS-Javascript] - Bộ ba công nghệ web, hiện thức hóa giao diện

## Hướng dẫn và Cài đặt

# Mở link Deploy Frontend

[https://heroic-strudel-517f05.netlify.app/client/view/pages/homepage]

# Bước 1. **Clone repository**
git clone https://github.com/dtam2812/IE104---Movie-Database-and-Updates-Website.git

cd IE104---Movie-Database-and-Updates-Website/server

# Bước 2. Tạo file .env trong thư mục server
![image alt](https://github.com/MinhThienMina/Image/blob/2e9f586905997af8ec324105db1ff7797d16ef53/image.png)

# Nội dung tham khảo:

SECRET_JWT=jwtSecret

PORT=5000

DB_URL=mongodb+srv://nguyenductam98765_db_user:ie104Nhom2@cluster0.rhi4hs0.mongodb.net/movieDB?retryWrites=true&w=majority&appName=Cluster0

DATABASE_NAME=MovieWeb

# Bước 3. Cài đặt các package cần thiết
cd server

npm install bcrypt bcryptjs cors dotenv express jsonwebtoken mongodb mongoose nodemailer

npm install -D nodemon

![image alt](https://github.com/MinhThienMina/Image/blob/5aacb1423079dd21acce0f6ada438eef73f9ccef/Screenshot%202025-11-19%20230531.png)

# Bước 4. Chạy server
npm start

![image alt](https://github.com/MinhThienMina/Image/blob/4eebaaf4d35bb6cba6908330b899c7b7c135aa62/image.png)

# Bước 5. Mở trình duyệt và vào trang HomePage trong mục view/pages ở bên client (nếu Link Deploy gặp lỗi):

![image alt](https://github.com/MinhThienMina/Image/blob/030136bd51c4a07ec58894204e00724f19515081/s.png)

Tài khoản mẫu

Admin

Email: 23521384@gm.uit.edu.vn

Mật khẩu: 123456

![image alt](https://github.com/MinhThienMina/Image/blob/bdb54caf0776ad0da5e86ef2eb385e1a9f1af343/ad.png)


Bạn có thể đăng ký tài khoản mới để thử các chức năng. 
![image alt](https://github.com/MinhThienMina/Image/blob/d7ef3095cd6dbd155b37d3f75ddc67debffdab48/film.png)

## Chúc các bạn thành công!!!
