<<<<<<< HEAD
# Smart IoT MVC — Hệ thống giám sát nhiệt độ, độ ẩm và ánh sáng

Dự án này được hoàn thiện từ báo cáo/SRS và hai thư mục Frontend/Backend tham khảo.

## 1. Công nghệ

- Frontend: **HTML5 + CSS3 + JavaScript thuần**, không React/Vue/Angular/Bootstrap.
- Biểu đồ: Canvas API bằng JavaScript thuần (`frontend/js/core/simpleChart.js`).
- Backend: Node.js + Express.js.
- Database: MongoDB + Mongoose.
- Realtime: Socket.IO.
- Hardware ↔ Backend: MQTT (Mosquitto).
- Authentication: JWT HS256; phần ký/xác thực JWT được cài bằng module `crypto` có sẵn của Node.js.

Mục tiêu là giữ code đủ đơn giản để có thể giải thích và sửa trực tiếp khi bảo vệ bài.

## 2. Mô hình MVC

```text
SmartIoT_MVC/
├── backend/
│   ├── models/          # Model: User, Sensor, DataSensor, Device, ActionHistory
│   ├── controllers/     # Controller xử lý nghiệp vụ
│   ├── routes/          # Route ánh xạ HTTP -> Controller
│   ├── services/        # MQTT service
│   ├── middleware/      # JWT middleware, error handler
│   ├── utils/           # JWT, password, query helpers
│   ├── scripts/         # seed + migrate dữ liệu backend cũ
│   └── server.js
└── frontend/            # View của MVC: HTML/CSS/JS thuần
    ├── index.html
    ├── login.html
    ├── css/
    └── js/
```

## 3. Chức năng đã hoàn thiện

### Dashboard
- 3 thẻ realtime: Nhiệt độ, Độ ẩm, Ánh sáng.
- **3 biểu đồ riêng biệt** thay vì 1 biểu đồ chung.
- Mỗi biểu đồ giữ tối đa 50 điểm gần nhất.
- Cảnh báo khi quá 30 giây không nhận dữ liệu mới.
- Hiển thị danh sách thiết bị và toggle ON/OFF.
- Trạng thái `LOADING`, `success`, `fail`, `timeout`.
- Timeout phản hồi phần cứng mặc định 10 giây.

### Data Sensor
- Tải lịch sử mặc định, mới nhất trước.
- Tìm kiếm **chỉ theo thời gian**, nhập đầy đủ ngày/tháng/năm + giờ/phút/giây bằng `datetime-local`.
- Backend thực hiện tìm đúng trong giây được chọn.
- Filter theo cảm biến.
- Filter theo khoảng giá trị.
- Phân trang.
- Giữ nguyên tiêu chí khi đổi trang.

### Action History
- Tải 20 bản ghi mới nhất khi mở trang.
- Tìm kiếm **chỉ theo thời gian**, chính xác đến giây.
- Filter theo thiết bị.
- Filter theo hành động ON/OFF.
- Filter theo trạng thái success/fail/timeout/loading.
- Phân trang.

### Profile
- Hiển thị ảnh đại diện, họ tên, MSSV, lớp, email.
- Hiển thị link GitHub, Figma, Postman, báo cáo.
- Cho phép cập nhật thông tin.

### Authentication
- Login bằng username/password.
- JWT Bearer Token.
- Các API người dùng đều yêu cầu JWT.
- Logout phía Frontend xóa token.

## 4. Chuẩn MQTT mặc định

Các topic được giữ gần với backend tham khảo để dễ nối phần cứng đang chạy:

```env
MQTT_SENSOR_TOPIC=home/sensors/data
MQTT_CONTROL_TOPIC=home/devices/control
MQTT_STATUS_TOPIC=home/devices/status
MQTT_USERNAME=
MQTT_PASSWORD=
```


## 4.1. Đối chiếu với `main.cpp` phần cứng

Project đã được đối chiếu với code ESP32 hiện tại và dùng đúng ba topic:

- ESP32 publish dữ liệu: `home/sensors/data`
- ESP32 subscribe lệnh: `home/devices/control`
- ESP32 publish phản hồi: `home/devices/status`

Payload dữ liệu cảm biến mà Backend nhận trực tiếp:

```json
{
  "temperature": 28.4,
  "humidity": 75.2,
  "light": 301.0
}
```

Payload Backend gửi xuống ESP32:

```json
{
  "device_id": "led_1",
  "action": "ON"
}
```

ESP32 phản hồi:

```json
{
  "device_id": "led_1",
  "status": "ON",
  "result": "success"
}
```

`led_1`, `led_2`, `led_3` trong database khớp với ba nhánh điều khiển trong `main.cpp`. Backend cũng đã hỗ trợ MQTT username/password qua `.env`.

**Lưu ý địa chỉ Broker:** dùng địa chỉ IPv4 của laptop trong mạng Wi-Fi hiện tại (xem bằng `ipconfig`). Khi laptop đổi mạng hoặc đổi IP, cần sửa đồng thời `mqtt_server` trong ESP32 và `MQTT_BROKER` trong `backend/.env`.

### ESP -> Backend: dữ liệu cảm biến

Publish tới `home/sensors/data`:

```json
{
  "temperature": 28.4,
  "humidity": 75.2,
  "light": 301
}
```

Backend cũng chấp nhận khóa `temp` và `humid`.

### Backend -> ESP: lệnh điều khiển

Backend publish tới `home/devices/control`:

```json
{
  "device_id": "led_1",
  "action": "ON"
}
```

`action` nhận `ON` hoặc `OFF`.

### ESP -> Backend: phản hồi thiết bị

Publish tới `home/devices/status`:

```json
{
  "device_id": "led_1",
  "status": "ON",
  "result": "success"
}
```

Backend cũng hỗ trợ dạng map theo `mqtt_key`:

```json
{
  "led1": "on",
  "led2": "off",
  "led3": "on"
}
```

## 5. Cài đặt

### Bước 1 — Yêu cầu
- Node.js 18+.
- MongoDB chạy local hoặc MongoDB Atlas.
- Mosquitto MQTT Broker.

### Bước 2 — Cấu hình

Vào thư mục backend:

```bash
cd backend
```

File `.env` an toàn cho môi trường local đã có sẵn. Nếu dùng MongoDB Atlas, chỉ thay `MONGO_URI`.

**Không đưa mật khẩu MongoDB thật lên GitHub.**

### Bước 3 — Cài thư viện

```bash
npm install
```

### Bước 4 — Tạo dữ liệu ban đầu

```bash
npm run seed
```

Tài khoản mặc định lấy từ `.env`:

```text
username: admin
password: admin123
```

Nên đổi trước khi nộp/demo.

### Bước 5 — Chạy

```bash
npm start
```

Sau đó mở:

```text
http://localhost:3000/login.html
```

## 6. Nếu đang dùng database của backend cũ

Backend tham khảo lưu một document dạng:

```json
{
  "temperature": 28,
  "humidity": 75,
  "light": 301,
  "timestamp": "..."
}
```

Trong bản MVC này, SRS được áp dụng rõ hơn: mỗi giá trị cảm biến là một bản ghi `datasensor`.

Có script chuyển dữ liệu cũ:

```bash
npm run migrate:legacy
```

Script đọc collection cũ `datasensors`, chuyển thành 3 bản ghi/cụm trong collection mới `datasensor`.
Dữ liệu cũ không bị xóa.

## 7. API chính

Base URL:

```text
http://localhost:3000/api/v1
```

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/logout` | Đăng xuất |
| GET | `/dashboard/sensors/latest` | 3 giá trị mới nhất |
| GET | `/dashboard/sensors/chart` | Dữ liệu 3 biểu đồ |
| GET | `/sensors` | Danh sách cảm biến |
| GET | `/datasensor` | Lịch sử cảm biến + filter + phân trang |
| GET | `/datasensor/:id` | Chi tiết 1 bản ghi |
| POST | `/datasensor` | API nội bộ ghi dữ liệu |
| GET | `/devices` | Danh sách thiết bị |
| POST | `/devices/:id/control` | Gửi lệnh ON/OFF |
| PATCH | `/devices/:id/status` | Internal status callback |
| GET | `/actions` | Lịch sử điều khiển |
| GET | `/actions/:id` | Chi tiết action |
| GET | `/profile` | Profile |
| PUT | `/profile` | Cập nhật profile |
| PATCH | `/profile/password` | Đổi mật khẩu |
| POST | `/profile/avatar` | Cập nhật avatar URL |

## 8. Tìm kiếm thời gian ở Data Sensor / Action History

Frontend dùng:

```html
<input type="datetime-local" step="1">
```

Ví dụ người dùng chọn:

```text
16/09/2026 14:25:31
```

Frontend chuyển sang `from` và `to` bao quanh đúng 1 giây:

```text
from = 14:25:31.000
to   = 14:25:31.999
```

Do đó ô tìm kiếm không tìm tên, ID hay giá trị; nó chỉ tìm theo timestamp như yêu cầu.

## 9. Các file nên đọc trước khi thầy hỏi

Nếu cần nắm nhanh luồng chương trình:

1. `backend/server.js`
2. `backend/services/mqttService.js`
3. `backend/controllers/deviceController.js`
4. `backend/controllers/sensorController.js`
5. `frontend/js/views/dashboard.js`
6. `frontend/js/views/dataSensor.js`
7. `frontend/js/views/actionHistory.js`
8. `frontend/js/core/api.js`

Các file đều tách nhỏ để dễ sửa và giải thích.
=======
# SmartIoT_MVC
Bài tập lớn môn IoT, đo dữ liệu cảm biến nhiệt độ, độ ẩm và ánh sáng.
>>>>>>> 4eea66f5a010acf2598a83f9e1e1ea5abd7a219e
