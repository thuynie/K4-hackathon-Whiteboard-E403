# USER VALIDATION LOG — VLearn Focus Tutor (CP5)

> Vòng kiểm chứng người dùng (User Validation) thực hiện tại mốc CP5 với **3 Willing Users** để đánh giá tính hữu ích, độ chính xác và trải nghiệm thực tế của sản phẩm.

---

## 👥 DANH SÁCH WILLING USERS PHỎNG VẤN

| STT | Người dùng | Vai trò / Bối cảnh | Thời gian test | Môi trường test |
|:---:|---|---|:---:|:---:|
| 1 | **Nguyễn Hoàng Nam** | Học viên Batch 03 (Đang học Day 1 & Day 2) | 31/07/2026 | Local Web Prototype (`codebase/`) |
| 2 | **Trần Thu Trang** | Junior PM (Mới bắt đầu học về AI Product) | 31/07/2026 | Local Web Prototype (`codebase/`) |
| 3 | **Phạm Đức Anh** | AI Developer (Học viên quan tâm RAG & Grounding) | 31/07/2026 | Local Web Prototype (`codebase/`) |

---

## 📝 3 CÂU HỎI KIỂM CHỨNG CHÍNH (VALIDATION QUESTIONS)

1. **Q1 (Độ hiểu bài & Tiết kiệm thời gian)**: *Khi gặp một thuật ngữ khó trên slide, việc bôi đen để AI Tutor giải thích trực tiếp ngay tại trang có giúp bạn hiểu bài nhanh hơn so với việc tự tra Google/ChatGPT không?*
2. **Q2 (Độ tin cậy & Căn cứ trích dẫn)**: *Nhãn `● Căn cứ rõ` kèm số trang `[Trang N]` và Fact Inspector 2 cột có giúp bạn cảm thấy tin tưởng câu trả lời hơn, không sợ bị AI "chém gió" không?*
3. **Q3 (Trải nghiệm bị từ chối/hỏi lại)**: *Khi bạn đặt câu hỏi quá mập mờ hoặc ngoài phạm vi bài học, việc AI Tutor dừng lại hỏi bạn 2 lựa chọn hoặc từ chối có làm bạn khó chịu không?*

---

## 💬 TRÍCH DẪN NGUYÊN VĂN (VERBATIM QUOTES) & PHẢN HỒI NGUYÊN BẢN

### 👤 1. Nguyễn Hoàng Nam (Học viên Batch 03)

* **Quote 1 (Q1)**: *"Bình thường học đến trang 12 slide 1 thấy ba từ predict - append - rerun là mình phải mở tab mới search ChatGPT. Giờ bôi đen ngay trên slide bấm 'Hỏi AI' nó ra luôn ví dụ nối toa tàu cực dễ hiểu, đỡ mất công chuyển tab gián đoạn mạch học."*
* **Quote 2 (Q2)**: *"Điểm thích nhất là nút 'Kiểm tra căn cứ Trang 12'. Bấm vào nó mở khung 2 cột cho xem đoạn văn gốc trên slide bên cạnh lời giải thích của AI, nhìn phát biết ngay AI không tự bịa."*
* **Quote 3 (Q3)**: *"Lúc đầu mình gõ thử 'Cái này dùng sao', AI không trả lời bừa mà hiện 2 lựa chọn 'Cách chọn token' hay 'Vòng lặp rerun'. Thấy rất thông minh vì đúng là câu hỏi của mình mập mờ thật."*

### 👤 2. Trần Thu Trang (Junior PM)

* **Quote 1 (Q1)**: *"Mình ấn tượng với cấu trúc 3 phần của Tutor: có trọng tâm, có ví dụ đời sống, xong có thêm câu hỏi tự kiểm tra ở cuối. Giúp mình vừa hiểu khái niệm PM vs Project Manager ở Day 2 trang 2 vừa tự nhớ bài luôn."*
* **Quote 2 (Q2)**: *"Học PM ngại nhất là AI trả lời chung chung trên mạng. Tutor này chỉ trả lời những gì có trong bài giảng của thầy, không đưa kiến thức lan man bên ngoài nên mình rất yên tâm."*
* **Quote 3 (Q3)**: *"Thử hỏi về giá cổ phiếu FPT, AI bảo luôn là slide không có thông tin này và bảo gửi TA. Từ chối thẳng thắn thế này tốt hơn nhiều so với việc AI tự đoán mò."*

### 👤 3. Phạm Đức Anh (AI Developer)

* **Quote 1 (Q1)**: *"Thanh menu nổi popover bôi đen từ hoạt động mượt. Bôi từ nào là giải thích bối cảnh từ đó trên slide. Tính năng tóm tắt toàn bộ bài giảng phủ đủ cả 24 slide Day 2 rất tiện cho việc review trước buổi học."*
* **Quote 2 (Q2)**: *"Phần lịch sử hỏi (Session History) rất hữu ích, bấm vào câu hỏi cũ trong lịch sử là ứng dụng tự nhảy đúng về trang slide đó luôn."*
* **Quote 3 (Q3)**: *"Cần bổ sung thêm hiển thị badge rõ ràng khi đang chạy Live Gemini API hay Offline Engine để người dùng biết khi nào AI đang gọi API thật."*

---

## 🔄 TỔNG HỢP FEEDBACK & ĐIỀU CHỈNH SẢN PHẨM TRỰC TIẾP (PRODUCT ADJUSTMENTS)

| Feedback từ User | Điều chỉnh của Nhóm | File / Nơi áp dụng |
|---|---|:---:|
| User muốn biết rõ AI đang gọi API thật hay chạy Offline | Thêm **Engine Status Badge (`⚡ Gemini API (Live AI Active)`)** hiển thị nổi bật trên Topbar với hiệu ứng pulse xanh. | `codebase/index.html` & `app.js` |
| Bôi đen từ trên slide đôi khi bị rơi menu xuống dưới | Sửa tọa độ hiển thị Popover menu `position: fixed` chuẩn xác theo viewport. | `codebase/app.js` |
| Muốn xem lại các câu hỏi cũ và nhảy về slide tương ứng | Phát triển tính năng **📜 Lịch sử hỏi (Session History)** lưu LocalStorage và tự nhảy trang slide khi nhấp. | `codebase/app.js` & `index.html` |
