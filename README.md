# FTU Exchange Finder

Website tĩnh cho sinh viên FTU tìm trường trao đổi phù hợp với tiến độ học tập.

## Chạy website

Mở `index.html` bằng trình duyệt. Để tính năng tải `.xlsx` hoạt động ổn định nhất, chạy bằng một local server, ví dụ trong thư mục này:

```powershell
python -m http.server 8080
```

Sau đó truy cập `http://localhost:8080`.

## Dữ liệu và thuật toán matching

- `data.js` được sinh từ ba bảng Excel nguồn đã cung cấp: đối tác mở bổ sung Fall 2026, bảng học phần tương đương, và bảng chi phí.
- Khi tải file CTĐT xuất từ FTUGate, trình duyệt đọc cột có tên gần với `Mã môn`, `Mã học phần`, hoặc `Course code`. Các môn có trạng thái/điểm không thể hiện đã hoàn thành sẽ được coi là cần đối chiếu.
- Một trường được đề xuất khi có ít nhất 3 mã môn FTU chưa hoàn thành khớp với học phần tương đương trong dữ liệu. Khi mở một trường từ kết quả upload, trang chi tiết chỉ hiển thị đúng các mã đã khớp (mỗi mã FTU một lần), thay vì toàn bộ danh mục quy đổi của trường.
- Các dòng dữ liệu có nghĩa phủ định như `Không tương đương`, `Đang xét` hoặc `Không có học phần…` được loại khỏi phép đối chiếu.
- Việc đọc tệp diễn ra hoàn toàn trên trình duyệt. Đây là công cụ hỗ trợ, không thay thế phê duyệt quy đổi học phần của FTU.

## Tệp chính

- `index.html`: cấu trúc 4 trang và modal review.
- `styles.css`: giao diện responsive với hệ màu đỏ FTU.
- `app.js`: điều hướng, tìm/lọc/sắp xếp, phân tích Excel và review UI.
- `data.js`: danh sách đối tác, học phần quy đổi và chi phí đã chuyển đổi từ Excel.
