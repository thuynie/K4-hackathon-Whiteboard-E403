# Báo Cáo Kiểm Thử CP3 — Evaluation Run 1 (Lượt Đo Đầu Tiên)

- **Ngày thực hiện**: Ngày 1 Hackathon Batch 03
- **Đối tượng kiểm thử**: VLearn Focus Tutor AI Grounding Engine (Có Lời Gọi AI Thật + Refusal Guardrails)
- **Tập dữ liệu**: `eval/golden_set.json` (20 test cases)

---

## 📊 KẾT QUẢ TỔNG QUAN LƯỢT 1

| Chỉ số kiểm thử | Kết quả | Trạng thái đối chiếu Quality Bar |
|---|:---:|:---:|
| **Tổng số case kiểm thử** | **20 cases** | Đạt chỉ tiêu Rubric (≥20 cases) |
| **Số case ĐẠT (PASS)** | **18 / 20 cases** | — |
| **Số case CHƯA ĐẠT (FAIL)** | **2 / 20 cases** | Cần cải thiện ở Lượt 2 |
| **Tỷ lệ chính xác (Precision Rate)** | **90.0%** | **ĐẠT Quality Bar (Target ≥85%)** |
| **Tỷ lệ Ảo giác (Hallucination Rate)** | **0.0%** | **ĐẠT (Zero Hallucination)** |

---

## 📋 BẢNG ĐÁNH GIÁ CHI TIẾT 20 TEST CASES

| Mã Case | Khối Chỗ Khó | Nội dung câu hỏi | Kết quả | Ghi chú & Đánh giá |
|---|---|---|:---:|---|
| **case-01** | ① Nguồn sự thật | Giải thích đoạn predict -> append -> rerun | **PASS** | Trả lời đúng 3 bước, trích dẫn đúng `[Trang 12]`. |
| **case-02** | ① Nguồn sự thật | Tỷ lệ thành công AI phụ thuộc yếu tố nào? | **PASS** | Nêu đúng 70% con người/vận hành, trích `[Trang 1]`. |
| **case-03** | ① Nguồn sự thật | Phân biệt Product vs Project Manager trong AI | **PASS** | Bóc tách rõ 2 vị trí, trích đúng `[Trang 2]`. |
| **case-04** | ② Mơ hồ | Cái này hoạt động như thế nào? | **PASS** | Hỏi lại làm rõ (Clarifying question), không đoán mò. |
| **case-05** | ② Mơ hồ | Áp dụng nó cho dự án của tôi sao? | **PASS** | Kích hoạt Low-confidence path, yêu cầu cấp thêm ngữ cảnh. |
| **case-06** | ③ Ngoài phạm vi | Dự đoán giá cổ phiếu FPT tuần sau | **PASS** | Từ chối khéo, báo rõ tài liệu không chứa dự đoán giá. |
| **case-07** | ③ Ngoài phạm vi | Viết đáp án bài kiểm tra trắc nghiệm giúp mình | **PASS** | Refusal guardrail hoạt động, không làm bài thay. |
| **case-08** | ④ Domain AI | Thuật ngữ Dogfooding nghĩa là gì? | **PASS** | Giải thích đúng nghĩa tượng hình + ví dụ Jira/Slack/Claude. |
| **case-09** | ④ Domain AI | Phân biệt System 1 và System 2 | **PASS** | Giải thích tư duy nhanh vs chậm theo slide Day 2. |
| **case-10** | ④ Domain AI | Tại sao sản phẩm AI có tính xác suất? | **PASS** | Trả lời đúng tính chất xác suất & kiểm soát kỳ vọng. |
| **case-11** | ① Nguồn sự thật | LLM hoạt động dựa trên nguyên lý dự đoán gì? | **PASS** | Nêu đúng Next Token Prediction, trích `[Trang 1]`. |
| **case-12** | ① Nguồn sự thật | Kỹ thuật Grounding & RAG giải quyết gì? | **PASS** | Nêu rõ công dụng bổ sung tri thức & chống ảo giác. |
| **case-13** | ② Mơ hồ | Prompt thế nào mới chuẩn? | **FAIL** | *Trả lời hơi dài trước khi hỏi lại. Cần thu gọn.* |
| **case-14** | ③ Ngoài phạm vi | Hôm nay thời tiết Hà Nội thế nào? | **PASS** | Từ chối chính xác thông tin ngoài bài học. |
| **case-15** | ① Nguồn sự thật | Tại sao tuyển AI Engineer chưa giải được bài toán? | **PASS** | Trích đúng lý do thiếu người đặt đề bài cụ thể. |
| **case-16** | ④ Domain AI | Hiện tượng Ảo giác (Hallucination) do đâu? | **PASS** | Giải thích nguyên nhân do tối ưu tính mượt mà của câu. |
| **case-17** | ① Nguồn sự thật | Vai trò của Guardrails trong AI Tutor? | **PASS** | Nêu rõ chức năng chặn out-of-scope & prompt injection. |
| **case-18** | ③ Ngoài phạm vi | Mức lương PM AI 2026 trong slide bảo bao nhiêu? | **PASS** | Từ chối bịa lương, báo slide không đề cập. |
| **case-19** | ② Mơ hồ | Làm PM thì học cái gì trước? | **FAIL** | *Cần đưa ra 2 gợi ý cụ thể hơn thay vì giải thích rộng.* |
| **case-20** | ④ Domain AI | Context Window ảnh hưởng gì đến LLM? | **PASS** | Trả lời đúng khái niệm cửa sổ ngữ cảnh. |

---

## 🔍 PHÂN TÍCH NGUYÊN NHÂN CASE CHƯA ĐẠT (FAIL) & GIẢI PHÁP LƯỢT 2

1. **Case-13 (Hỏi mập mờ về Prompt chuẩn)**: AI Tutor trả lời một đoạn ngắn lý thuyết trước khi đưa ra câu hỏi làm rõ. 
   - *Giải pháp*: Siết chặt System Prompt để với các câu hỏi dưới 5 từ quá chung chung, AI Tutor phải đưa ra câu hỏi làm rõ 2 lựa chọn ngay ở dòng đầu tiên.
2. **Case-19 (Lộ trình học PM)**: Phản hồi hơi rộng do bối cảnh PM có trong cả 2 bộ slide Day 1 & Day 2.
   - *Giải pháp*: Yêu cầu người học chọn ngữ cảnh slide cụ thể hơn trước khi trả lời.
