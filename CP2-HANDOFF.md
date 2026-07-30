# CP2 — Vlearn Focus Tutor

## 1. CP2 yêu cầu gì?

Theo `04-rubric.md`, CP2 cần show:

- Prototype Sketch/Mock có **flow chính bấm đi hết được**.
- Repo có **commit đầu**.

CP2 chưa yêu cầu AI thật. AI thật ở quyết định trung tâm, golden set và lượt đo đầu thuộc CP3.

## 2. Đề tài và pain được chọn

**Hướng A — tối ưu AI tutor hiện có:** giúp tutor giải thích đúng nội dung slide mà học viên đang chọn.

Pain cụ thể: học viên đang học trong buổi, chọn một đoạn trên slide để làm rõ nhưng tutor có thể không lấy đúng nội dung trang, trả lời chung chung hoặc không cho người học cách tự kiểm; hậu quả là người học vẫn chưa hiểu, phải tua lại bài/đổi công cụ và có nguy cơ học sai.

Tín hiệu mining ban đầu trên 1.261 message của học viên:

| Tín hiệu từ nội dung câu hỏi | Số message |
|---|---:|
| Có từ “giải thích” | 463 |
| Có cụm “slide này” | 33 |
| Có từ “tóm tắt” | 125 |
| Có cụm “không hiểu” | 5 |

Đây là phép đếm chuỗi không phân biệt hoa/thường trên `content`, chỉ dùng làm tín hiệu ban đầu cho CP2; chưa phải kết luận phân loại pain cuối cùng của CP4.

## 3. Lát cắt một câu

> Khi học viên đang học một slide và chọn đúng đoạn chưa hiểu, tutor quyết định chỉ giải thích bằng nội dung có căn cứ trên slide/transcript, để học viên hiểu đúng ý ngay mà không phải rời trang hoặc tự kiểm lại một câu trả lời chung chung.

Đối chiếu format:

- Một user: học viên đang học một slide.
- Một việc: làm rõ đoạn vừa chọn.
- Một quyết định AI: giải thích chỉ khi có căn cứ đúng ngữ cảnh.
- Một kết quả: hiểu đúng ý ngay trong trang học.

## 4. Flow chính có thể bấm

`Chọn đoạn trên slide → nhận chip ngữ cảnh → đặt câu hỏi → nhận giải thích → mở căn cứ trang 12 → quay lại → feedback hoặc chọn lại đoạn`.

Các trạng thái đã dựng:

1. **Trước khi chọn:** ô hỏi bị khóa để tránh câu hỏi mất ngữ cảnh.
2. **Đã chọn:** hiện đoạn và ba câu hỏi nhanh.
3. **Đang trả lời:** trạng thái chờ ngắn.
4. **Có kết quả:** giải thích ngắn, nhãn căn cứ, trích dẫn, feedback.
5. **Correction:** người học có thể bỏ output và chọn lại đoạn.

## 5. Automation và cost-of-error

Chọn **Conditional automation**:

- Case có căn cứ rõ trong slide/transcript: tutor tự giải thích.
- Case mơ hồ: yêu cầu chọn lại đoạn hoặc hỏi rõ một câu.
- Case không có căn cứ: không đoán; nói rõ giới hạn và hướng người học về TA/tài liệu.

Lý do: giải thích sai khiến học viên học sai kiến thức và mất niềm tin; chi phí sửa không chỉ là sửa một câu trả lời mà còn phải phát hiện người học đã hiểu sai ở đâu. Vì vậy không chọn Automate hoàn toàn.

## 6. Bốn đường đi đã bấm được trong CP2

| Đường đi | Cách kích hoạt trong prototype | Hành vi đã thể hiện |
|---|---|---|
| Happy path | `Giải thích dễ hiểu` | Trả lời ngắn, nhãn căn cứ, mở được trang 12 |
| Low-confidence | `② Câu hỏi mơ hồ` | Không đoán “cái này”; hỏi lại bằng hai lựa chọn |
| Failure/không căn cứ | `① Không có căn cứ` | Nói rõ slide không chứa kết luận và cho chuyển TA |
| Correction | `Không đúng ý mình → chọn lại đoạn` | Bỏ ngữ cảnh cũ, đưa người học về bước chọn đoạn |

Ngoài ra, case `③ Ngoài phạm vi` từ chối làm bài kiểm tra thay nhưng vẫn đề nghị giải thích hoặc tự kiểm tra kiến thức.

## 7. Kịch bản demo 2 phút

1. Mở `codebase/index.html`, chỉ vào nhãn `CP2 MOCK`.
2. Nói pain trong một câu.
3. Bấm đoạn được tô trên slide 12.
4. Bấm `Giải thích dễ hiểu`.
5. Bấm `Xem căn cứ trên slide` để chứng minh trust không dựa vào lời hứa.
6. Mở `Thử các đường đi rủi ro`, bấm case mơ hồ và không có căn cứ.
7. Bấm `Không đúng ý mình → chọn lại đoạn`.
8. Kết luận: bốn đường đi đã bấm hết; retrieval/AI thật và đo chất lượng là CP3.

## 8. Checklist trước khi nộp

- [x] Có `codebase/`.
- [x] Flow chính bấm đi hết được.
- [x] Mock/data giả được ghi rõ.
- [x] Không có API key.
- [x] Không commit nguyên data pack vào phần prototype.
- [ ] Nhóm điền thành viên và phân công có tên trong README chính.
- [x] Có commit CP2 trong repo.
- [ ] Mỗi thành viên nộp cùng link repo đúng giờ của khóa.
