# Reflection — Product Lead (Member 1)

**Họ và tên:** Nguyễn Văn A  
**Vai trò:** Product Lead & Product Manager  
**Phần chịu trách nhiệm:** Khai thác dữ liệu bằng chứng (`data/vlearn-pack/chatlog/`), xây dựng tài liệu AI Spec (`spec.md`), định hình lát cắt 1 câu, xác định Non-goals & HAX/PAIR principles, và biên soạn bộ slide thuyết trình (`demo-slides.md`).

---

## 1. Những việc tôi đã làm

Trong 1.5 ngày hackathon vừa qua, nhiệm vụ trung tâm của tôi là giữ cho nhóm **không bị lạc hướng vào việc viết code vô định**, mà luôn bám chặt vào **bằng chứng người dùng và tư duy sản phẩm AI**:

1. **Khai thác dữ liệu chatlog thực tế (Data Mining)**: Tôi dành 2 giờ đầu tiên quét toàn bộ **1.261 câu thoại ẩn danh** trong thư mục `data/vlearn-pack/chatlog/`. Tôi tìm ra con số bằng chứng đắt giá nhất: **463/1.261 tin nhắn (36,7%)** liên quan trực tiếp đến việc học viên yêu cầu giải thích các khái niệm chưa hiểu trên slide.
2. **Cắt lát sản phẩm 1 câu (One-sentence slice)**: Tôi cùng nhóm chốt lát cắt tập trung duy nhất: *"Khi học viên đang học một slide và bôi đen đoạn chưa hiểu, AI Tutor quyết định chỉ giải thích dựa trên căn cứ có thật trong slide/transcript [Trang N], giúp học viên hiểu đúng ngay trên trang học."*
3. **Xây dựng tài liệu AI Spec (`spec.md`)**: Lập tài liệu chuẩn 8 phần theo template, định nghĩa 3 Non-goals nghiêm ngặt (không làm bài hộ, không dự đoán cổ phiếu, không ảo giác) và thiết kế 4 đường đi trải nghiệm (Happy path, Low-confidence, Refusal, Correction).
4. **Áp dụng bộ nguyên tắc HAX/PAIR**: Đưa 4 nguyên tắc HAX/PAIR (`G1`, `G9`, `G10`, `G11`) vào thiết kế giao diện, đặc biệt là Fact Inspector 2 cột và nhãn tự tin `● Căn cứ rõ`.
5. **Soạn thảo slide demo (`demo-slides.md`)**: Biên soạn kịch bản 6 trang slide phục vụ 5 phút thuyết trình tại mốc CP6.

---

## 2. Sai lầm lớn nhất của tôi trong dự án này

Sai lầm lớn nhất của tôi ở giai đoạn đầu là **muốn ôm quá nhiều tính năng (Scope Creep)**. 

Ban đầu, tôi đã vẽ ra kịch bản cho AI Tutor: vừa tự động tóm tắt bài giảng, vừa tạo câu hỏi trắc nghiệm ôn tập, vừa đánh giá bài làm của học viên, và tích hợp cả voice bot. Ý tưởng nhìn trên giấy rất hoành tráng, nhưng khi thảo luận với AI Engineer (Member 2), nhóm nhận ra nếu làm như vậy thì:
- Không thể kiểm soát được rủi ro ảo giác (hallucination).
- Bộ Golden Set sẽ bị phình to và không thể đo lường chính xác.
- Nhóm sẽ thất bại ở mốc CP2 và CP3 vì không có một lát cắt đủ mỏng để chạy thật.

**Cách tôi sửa chữa**:
Tôi lập tức dừng lại, quay về đọc kỹ `02-guide.md` §1 và cắt bỏ 70% các tính năng rườm rà. Tôi chốt cứng **3 Non-goals** trong `spec.md` và tập trung 100% nguồn lực vào một bài toán duy nhất: **Giải thích bám sát slide [Trang N]**. Nhờ cắt gọt phạm vi kịp thời, nhóm mới có thể hoàn thành lời gọi AI thật và bộ đo Golden Set 20 cases đạt 90.0% trước hạn CP4.

---

## 3. Bài học quan trọng nhất tôi mang đi

1. **Bằng chứng số liệu quan trọng hơn cảm tính**: Một con số thực tế trích từ 1.261 chatlogs (`36,7% câu hỏi giải thích`) có sức thuyết phục gấp mười lần những câu nói chung chung như "nhiều học viên phàn nàn".
2. **Biết nói KHÔNG (Non-goals) chính là chìa khóa của AI Product**: Trong phát triển sản phẩm AI, việc xác định rõ *AI KHÔNG ĐƯỢC LÀM GÌ* (Refusal Guardrails) quan trọng không kém việc xác định AI làm gì. Sự từ chối minh bạch tạo nên độ tin cậy tuyệt đối cho người dùng.
