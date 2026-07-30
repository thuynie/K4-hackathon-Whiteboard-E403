# Vlearn Focus Tutor — Prototype CP2

## Chạy prototype

Không cần cài dependency:

1. Mở trực tiếp `index.html`; hoặc
2. Tại thư mục `codebase/`, chạy `python -m http.server 8080`, rồi mở `http://localhost:8080`.

## Flow cần show tại CP2

1. Nhấn đoạn được tô ở cuối slide 12.
2. Chọn `Giải thích dễ hiểu`, `Cho ví dụ`, hoặc tự nhập câu hỏi.
3. Đọc câu trả lời và nhấn `Xem căn cứ trên slide`.
4. Mở `Thử các đường đi rủi ro` và chạy lần lượt case mơ hồ, không có căn cứ, ngoài phạm vi.
5. Đóng căn cứ, sau đó thử `Không đúng ý mình → chọn lại đoạn`.

Flow trên đi hết được không cần can thiệp tay giữa chừng.

## Phạm vi CP2

- Mức hiện tại: **Mock**.
- Thật: giao diện, trạng thái chọn đoạn, bốn đường đi trải nghiệm, mở căn cứ, feedback và correction.
- Mock: slide minh họa, câu trả lời tutor, nhãn confidence và trích dẫn.
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
| Low-confidence | `② Câu hỏi mơ hồ` | Hỏi lại, đưa hai lựa chọn, không đoán |
| Failure | `① Không có căn cứ` | Nói rõ thiếu căn cứ + chuyển TA |
| Correction | `Không đúng ý mình` | Bỏ ngữ cảnh và cho chọn lại |

Case `③ Ngoài phạm vi` chứng minh tutor không làm bài kiểm tra thay học viên.

## Ghi chú dữ liệu

Nội dung slide minh họa được diễn giải ngắn từ slide Day 1, trang 12 trong data pack. Prototype không chứa nguyên data pack và không gửi dữ liệu ra dịch vụ ngoài.
