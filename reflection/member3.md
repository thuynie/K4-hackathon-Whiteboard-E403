# Reflection — UI & User Lead (Member 3)

**Họ và tên:** Lê Văn C  
**Vai trò:** UI & User Lead  
**Phần chịu trách nhiệm:** Xây dựng & tối ưu giao diện Web Prototype (`codebase/index.html`, `app.js`, `styles.css`), thực hiện phỏng vấn kiểm chứng 3 Willing Users (`validation/user_feedback.md`), phát triển các thành phần tương tác UI (Floating Popover toolbar, Fact Inspector 2 cột, Session History modal).

---

## 1. Những việc tôi đã làm

Tôi phụ trách trải nghiệm trực quan và sự tương tác giữa học viên với hệ thống AI Tutor:

1. **Phát triển giao diện Web Prototype bám sát Slide**: Dùng Vanilla JS + HTML5/CSS3 kết hợp **PDF.js** để đọc trực tiếp file PDF slide bài giảng nguyên bản. Thiết kế bố cục 2 cột: bên trái là Slide Canvas tương tác, bên phải là Trợ lý Focus Tutor.
2. **Xây dựng Popover Menu bôi đen nổi (`[🤖 Hỏi AI | ⚡ Báo bối rối | 📄 Ghi chú]`)**: Cho phép học viên dùng chuột bôi đen bất kỳ từ hoặc đoạn văn nào trên slide/transcript để kích hoạt ngay câu hỏi giải thích bối cảnh.
3. **Thiết kế Fact Inspector 2 cột minh bạch**: Khi bấm nút `↗ Kiểm tra căn cứ`, giao diện hiển thị Dialog 2 cột đối chiếu trực tiếp giữa *Đoạn văn nguyên bản trên Slide* và *Lời diễn giải của AI Tutor*, đáp ứng nguyên tắc **HAX G11 (Make clear why)**.
4. **Phát triển tính năng 📜 Lịch sử hỏi (Session History)**: Lưu toàn bộ câu hỏi và mốc trang slide vào LocalStorage, hỗ trợ nhấp vào câu hỏi cũ để ứng dụng tự nhảy đúng về trang slide `[Trang N]` đó.
5. **Thực hiện phỏng vấn 3 Willing Users (CP5)**: Trực tiếp phỏng vấn 3 người dùng (Học viên, Junior PM, Dev AI), ghi lại trích dẫn nguyên văn và điều chỉnh UI kịp thời dựa trên phản hồi.

---

## 2. Sai lầm lớn nhất của tôi trong dự án này

Sai lầm kỹ thuật lớn nhất của tôi là **tính toán sai tọa độ hiển thị của Floating Popover menu khi bôi đen văn bản**.

Ban đầu, tôi tính tọa độ menu nổi bằng công thức:
`popover.style.top = rect.top + window.scrollY`

Tuy nhiên, trong CSS tôi lại đặt `.floating-popover { position: fixed; }`. Do `position: fixed` lấy tọa độ theo khung nhìn Viewport (`rect.top`), việc cộng thêm `window.scrollY` khiến cho thanh menu bị đẩy chìm xuống tận đáy màn hình khi cuộn trang. Kết quả là học viên bôi đen từ trên slide nhưng menu không xuất hiện, làm gián đoạn trải nghiệm người dùng.

**Cách tôi sửa chữa**:
Sau khi phát hiện nguyên nhân từ phản hồi của người dùng, tôi đã loại bỏ `window.scrollY`, giữ nguyên tọa độ Viewport chuẩn `rect.top` cho `position: fixed`. Đồng thời, tôi thêm bộ xử lý `formatMarkdownHTML` để chuyển đổi các định dạng Markdown thô (`**bold**`, `*italic*`) thành HTML hiển thị đẹp mắt, giúp khung chat trở nên cực kỳ chuyên nghiệp và mượt mà.

---

## 3. Bài học quan trọng nhất tôi mang đi

1. **UX sản phẩm AI cần sự minh bạch tuyệt đối**: Người dùng rất nghi ngờ câu trả lời của AI. Việc đưa ra Fact Inspector 2 cột đối chiếu và nhãn `● Căn cứ rõ` làm cho người dùng cảm thấy hoàn toàn yên tâm.
2. **Lắng nghe phỏng vấn User để cải tiến UI**: Nhờ phỏng vấn 3 Willing Users ở mốc CP5, tôi mới nhận ra nhu cầu muốn lưu vết câu hỏi cũ và hiển thị rõ ràng đèn báo `⚡ Live Gemini API`. Phản hồi thực tế của người dùng chính là thước đo chính xác nhất cho chất lượng UI/UX.
