# Vlearn Focus Tutor — Prototype CP2

## Chạy prototype

Không cần cài dependency. Do trình duyệt cần đọc hai file PDF, chạy local server tại **thư mục gốc repo**:

```powershell
python -m http.server 8080
```

Sau đó mở `http://localhost:8080/codebase/`. Không mở trực tiếp `index.html` bằng `file://`.

## Flow cần show tại CP2

1. Chọn bộ `Day 1` hoặc `Day 2`.
2. Chọn một trong 29 thumbnail trang.
3. Nhấn khay nội dung dưới slide để mô phỏng bôi đen, rồi nhấn `Hỏi tutor`.
4. Chọn `Giải thích dễ hiểu`, `Cho ví dụ`, hoặc tự nhập câu hỏi.
5. Đọc câu trả lời và kiểm tra căn cứ đúng bộ/trang.
6. Thử `Không đúng ý mình → chọn lại đoạn`.

Flow trên đi hết được không cần can thiệp tay giữa chừng.

## Phạm vi CP2

- Mức hiện tại: **Mock**.
- Thật: giao diện web; PDF.js đọc trực tiếp toàn bộ 29 trang Day 1 và 29 trang Day 2 từ `data/vlearn-pack/slides/`; chọn bộ, thumbnail, chuyển trang, trạng thái chọn đoạn, panel tutor, feedback và correction.
- Mock: thao tác bôi đen được mô phỏng bằng khay nội dung trang; câu trả lời tutor, confidence và retrieval.
- Chưa có API/LLM thật. Đây là yêu cầu của CP3, không được tính là đã hoàn thành ở CP2.

## Lát cắt đang thể hiện

> Khi học viên đang học một slide và chọn đúng đoạn chưa hiểu, tutor quyết định chỉ giải thích bằng nội dung có căn cứ trên slide/transcript, để học viên hiểu đúng ý ngay mà không phải rời trang hoặc tự kiểm lại một câu trả lời chung chung.

## Nguyên tắc thiết kế đã hiện diện

- **G1/G2 — Làm rõ khả năng và giới hạn:** màn hình chào nói rõ tutor chỉ dùng slide/transcript.
- **G10 — Thu hẹp khi nghi ngờ:** người học phải chọn ngữ cảnh trước khi gửi câu hỏi.
- **G11 / Explainability + Trust:** mỗi câu trả lời có nút mở đoạn căn cứ.
- **G9 / Feedback + Control:** có đường sửa “Không đúng ý mình” và nút feedback ngay trên output.

## Bốn đường đi có thể kiểm trực tiếp

| Đường đi | Cách kích hoạt | Hành vi |
|---|---|---|
| Happy path | `Giải thích dễ hiểu` | Trả lời ngắn + căn cứ trang 12 |
| Low-confidence | Nhập `Cái này hoạt động như thế nào?` | Hỏi lại, đưa hai lựa chọn, không đoán |
| Failure | Hỏi về dự đoán giá cổ phiếu | Nói rõ thiếu căn cứ + chuyển TA |
| Correction | `Không đúng ý mình` | Bỏ ngữ cảnh và cho chọn lại |

Nhập yêu cầu “viết đáp án bài kiểm tra” để kiểm tra nhánh ngoài phạm vi.

## Ghi chú dữ liệu

Nội dung slide minh họa được diễn giải ngắn từ slide Day 1, trang 12 trong data pack. Prototype không chứa nguyên data pack và không gửi dữ liệu ra dịch vụ ngoài.
