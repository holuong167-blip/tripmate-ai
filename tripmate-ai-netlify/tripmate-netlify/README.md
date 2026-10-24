# TripMate AI – Đi đúng gu, chi đúng kế hoạch

Website du lịch Việt Nam: lập 3 phương án lịch trình, ví ngân sách 7 hũ, trợ lý theo quy tắc, mục Khám phá 34 tỉnh/thành (tìm được bằng tên tỉnh cũ), thời tiết Open-Meteo và tìm địa điểm bằng Google Places.

## 1. Cấu trúc
- `index.html`: toàn bộ giao diện (HTML + CSS + JS, không cần build).
- `netlify/functions/weather.js`: lấy thời tiết từ Open-Meteo (không cần khóa).
- `netlify/functions/places.js`: tìm địa điểm bằng Google Places API (New), cần khóa.
- `netlify.toml`: cấu hình; đường dẫn `/api/weather` và `/api/places` trỏ tới Functions.
- `.env.example`: tên các biến môi trường (không chứa khóa thật).

## 2. Trạng thái kiểm thử (trung thực)
| Hạng mục | Trạng thái |
|---|---|
| Cú pháp `index.html` (phần JS), 2 Functions | Đã kiểm tra |
| Logic 2 Functions với phản hồi giả lập: thành công, rỗng, 429, 5xx, mất mạng, thiếu khóa, đầu vào sai | Đã kiểm tra (14/14 đạt) |
| Gọi Open-Meteo thật | **Chưa kiểm thử** (môi trường soạn không có mạng) |
| Gọi Google Places thật | **Chưa kiểm thử**, cần khóa của bạn |
| Chạy trên Netlify, giao diện điện thoại | **Chưa kiểm thử**, bạn cần thử sau khi triển khai |
| Chức năng cũ (3 phương án, ví, trợ lý, Khám phá) | Mã giữ nguyên, chỉ thêm khối mới; chưa chạy lại trên trình duyệt |

## 3. Triển khai lên Netlify
Kéo thả thư mục có thể không triển khai Functions, nên hãy dùng Git hoặc CLI.

**Cách A – GitHub (khuyên dùng, cập nhật dễ):**
1. Giải nén ZIP, tạo repository GitHub và đẩy toàn bộ file lên (`.env` đã được bỏ qua bởi `.gitignore`).
2. Netlify > Add new site > Import an existing project > chọn repo. Build command để trống, Publish directory để `.` (đã có trong `netlify.toml`).
3. Deploy. Mỗi lần đẩy code mới, Netlify tự cập nhật.

**Cách B – CLI:** `npm i -g netlify-cli`, rồi `netlify login`, `netlify init` (hoặc `netlify link` nếu đã có site), `netlify deploy --prod`.

**Cập nhật website hiện có:** `netlify link` vào site cũ rồi `netlify deploy --prod`, hoặc nối site cũ với repo ở Cách A.

**Chạy thử cục bộ:** sao chép `.env.example` thành `.env`, rồi `netlify dev`.

## 4. Bật Google Places (tùy chọn)
Không có khóa, web vẫn chạy bình thường; phần tìm địa điểm chỉ hiện hướng dẫn cấu hình.
1. Vào Google Cloud Console, tạo project.
2. Bật thanh toán (Billing). Google bắt buộc cho Maps Platform và có thể phát sinh phí.
3. APIs & Services > Library > bật **Places API (New)**.
4. Credentials > Create credentials > API key.
5. Giới hạn khóa: mục *API restrictions* chọn chỉ **Places API (New)**. Khóa này dùng ở máy chủ nên không giới hạn bằng HTTP referrer; Netlify cũng không có IP cố định nên khó giới hạn theo IP.
6. Kiểm soát chi phí: đặt hạn mức/ngày (Quotas) cho Places API (New) và tạo Budget alert trong Billing.
7. Netlify > Site configuration > Environment variables: thêm `GOOGLE_PLACES_API_KEY` (đánh dấu là secret). Deploy lại.
8. `PLACES_RICH_FIELDS=true` bật thêm điểm đánh giá nhưng thường tính phí theo nhóm dữ liệu cao hơn. Mặc định tắt.

## 5. Chi phí
- Open-Meteo: API miễn phí dành cho mục đích phi thương mại; nếu dùng thương mại cần gói trả phí. Xem điều khoản hiện hành tại open-meteo.com.
- Netlify: có gói miễn phí với hạn mức, Functions bị tính vào hạn mức. Xem trang giá Netlify hiện hành.
- Google Places: có thể tính phí theo từng request và nhóm dữ liệu. Hãy xem bảng giá Google Maps Platform hiện hành, đặt quota và budget alert trước khi mở cho người dùng.
- TripMate không lưu kết quả Google/Open-Meteo; dữ liệu hiển thị kèm nguồn và thời điểm tải.

## 6. Giới hạn hiện tại
Chưa có: bản đồ nhúng, giá vé, nhà xe, giá phòng, tình trạng phòng, tài khoản đăng nhập. Thời tiết chỉ dùng cho 12 địa điểm có tọa độ trong danh sách; dữ liệu ví và chuyến đi lưu trên trình duyệt của từng thiết bị.
