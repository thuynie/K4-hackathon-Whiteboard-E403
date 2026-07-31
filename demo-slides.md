# DEMO SLIDE DECK (6 TRANG) — VLEARN FOCUS TUTOR
### Báo cáo thuyết trình 5 phút mốc CP6 · Nhóm Whiteboard-E403 · Zone A

---

## 🖼️ SLIDE 1: BỐI CẢNH, BÀI TOÁN & LÁT CẮT SẢN PHẨM

* **Bối cảnh**: Học viên khóa học AI Thực Chiến (Batch 03) khi đọc 2 bộ slide PDF (Day 1 & Day 2) hoặc transcript audio thường gặp các thuật ngữ khó hiểu (Next Token Prediction, Probabilistic, Dogfooding, RAG).
* **Nỗi đau (Pain Point)**: Học viên bị gián đoạn mạch học. Nếu dùng ChatGPT/Claude bên ngoài, AI trả lời lan man, bị ảo giác ngoài slide hoặc không trích dẫn được số trang.
* **🎯 Lát cắt MỘT CÂU (One-sentence Slice)**:
  > *"Khi học viên đang học một slide và bôi đen đoạn chưa hiểu, AI Tutor quyết định chỉ giải thích dựa trên căn cứ có thật trong slide/transcript [Trang N], giúp học viên hiểu đúng ngay trên trang học."*
* **Đội ngũ thực hiện**: Nguyễn Văn A (Product Lead) · Trần Thị B (AI Engineer) · Lê Văn C (UI Lead).

---

## 🖼️ SLIDE 2: BẰNG CHỨNG SỐ LIỆU (DATA MINING EVIDENCE)

* **Nguồn dữ liệu**: Khai thác toàn bộ **1.261 tin nhắn chatlog thật** (thư mục `data/vlearn-pack/chatlog/`).
* **Con số bằng chứng mạnh nhất**:
  * **463 / 1.261 tin nhắn (36,7%)**: Yêu cầu giải thích lại khái niệm trên slide bài học.
  * **125 / 1.261 tin nhắn (9,9%)**: Yêu cầu tóm tắt ý chính bài giảng.
  * **33 / 1.261 tin nhắn (2,6%)**: Tham chiếu trực tiếp "slide này".
* **Khảo sát người dùng (n = 22)**: **16/22 người (72,7%)** phải tạm dừng mạch học 15-20 phút để tự tra cứu Google/ChatGPT do AI cũ không trích dẫn mã trang slide `[Trang N]`.

---

## 🖼️ SLIDE 3: BỐN ĐƯỜNG ĐI TRẢI NGHIỆM & UI HIGHLIGHTS

1. **Happy Path (`● Căn cứ rõ`)**: Bôi đen từ/đoạn trên slide -> Bấm `🤖 Hỏi AI` -> Nhận giải thích 3 bước sư phạm (Trọng tâm + Ví dụ thực tế + Câu hỏi tự kiểm) kèm trích `📄 [Trang N]`.
2. **Low-Confidence Path (`● Chưa đủ rõ`)**: Nhập câu mập mờ ("Cái này dùng sao?") -> Tutor dừng lại hỏi lại bằng 2 lựa chọn khoanh vùng cụ thể.
3. **Refusal Guardrail (`● Không có căn cứ`)**: Hỏi ngoài phạm vi (giá cổ phiếu, thời tiết) -> Refusal Guardrail báo rõ thiếu căn cứ và đề nghị gửi TA.
4. **Correction Path (User sửa)**: Nhấn `Không đúng ý mình → chọn lại đoạn` -> Mở khóa bối cảnh cho phép bôi đen chọn lại vùng khác.
* **UI Highlights**: Popover menu bôi đen nổi, Fact Inspector 2 cột, Session History modal.

---

## 🖼️ SLIDE 4: KẾT QUẢ ĐO GOLDEN SET (EVALUATION RESULTS)

* **Bộ thử nghiệm Golden Set**: **20 cases** (`eval/golden_set.json`) phủ 4 lớp chỗ khó: ① Nguồn sự thật, ② Mơ hồ, ③ Ngoài phạm vi, ④ Thuật ngữ AI.
* **Quality Bar đã cam kết (chốt 23:59 N1)**: **≥ 85% câu thử đạt, và 0% Ảo giác (Zero Hallucination)**.
* **📊 Kết quả đo Lượt 1 (`eval/results_run1.md`)**:
  * **Tỷ lệ Đạt**: **90.0% (18 / 20 PASS)** — **ĐẠT QUALITY BAR**.
  * **Tỷ lệ Ảo giác (Hallucination Rate)**: **0.0%**.
  * **Phân tích 2 case FAIL**: `case-13` (Hỏi prompt chuẩn) & `case-19` (Lộ trình PM) bị nhận diện dư thông tin trước khi hỏi lại -> Nhóm đã siết System Prompt.

---

## 🖼️ SLIDE 5: PHẢN HỒI THỰC TẾ TỪ 5 WILLING USERS (USER VALIDATION)

* **Kiểm chứng với 5 Willing Users** (`validation/user_feedback.md`):
  * **Nguyễn Hoàng Nam (Học viên B03)**: *"Bôi đen ngay trên slide bấm 'Hỏi AI' ra luôn ví dụ nối toa tàu cực dễ hiểu, đỡ mất công chuyển tab gián đoạn mạch học."*
  * **Trần Thu Trang (Junior PM)**: *"Thích cấu trúc 3 phần có ví dụ đời sống và câu hỏi tự kiểm tra. Thử hỏi về giá cổ phiếu, AI từ chối thẳng thắn chứ không tự bịa."*
  * **Phạm Đức Anh (AI Dev)**: *"Fact Inspector 2 cột cho xem nguyên văn slide bên cạnh lời AI giúp mình tin tưởng 100%."*
  * **Vũ Minh Hoàng (TA Khóa học)**: *"Tutor trả lời rất bám sát tài liệu slide [Trang N], giải tỏa đáng kể khối lượng câu hỏi lặp lặp của học viên."*
  * **Lê Ngọc Anh (Học viên)**: *"Giao diện 2 cột vừa xem slide vừa hỏi Tutor rất tiện."*

---

## 🖼️ SLIDE 6: BÀI HỌC KINH NGHIỆM & QUY TRÌNH NHÓM

* **3 Bài học rút ra**:
  1. **Bằng chứng số liệu > Cảm tính**: Data mining 1.261 chatlogs giúp chốt đúng 100% nỗi đau lớn nhất của học viên.
  2. **Refusal Guardrail xây dựng niềm tin**: Sự từ chối minh bạch giúp AI Tutor đạt độ tin cậy cao hơn việc cố gắng trả lời mọi thứ.
  3. **Bộ đo Golden Set chính xác ngăn ngừa tự tin giả**: Xây bộ đo chuẩn từ dữ liệu thật giúp nhóm đánh giá đúng năng lực AI.
* **Trạng thái Repo**: Sẵn sàng 100% cho vòng Live Demo mốc CP6!
