# Reflection — AI & Evaluation Engineer

**Vai trò:** Chủ trì AI & Đo kiểm
**Phần chịu trách nhiệm:** `codebase/app.js` (lời gọi AI thật + system prompt), `eval/golden_set.json`, `eval/run_eval.py`, `eval/results_run*_auto.md`

---

## 1. Việc tôi làm

Tôi phụ trách hai thứ nối liền nhau: làm cho tutor **thực sự gọi AI**, và làm cho nhóm **biết tutor đúng bao nhiêu phần trăm**.

Cụ thể:

1. **Nối API thật.** Thay lớp mock trả lời có sẵn bằng một lời gọi tới Gemini API. Key đọc từ `localStorage` phía prototype và từ biến môi trường `GEMINI_API_KEY` phía script đo — không nằm trong repo.
2. **Viết system prompt.** Ép tutor chỉ nói bằng nội dung trang slide được truyền vào, bắt buộc trích `[Trang N]`, và quy định sẵn ba đường thoát: hỏi lại khi mơ hồ, từ chối khi ngoài phạm vi, không đoán khi không có căn cứ.
3. **Xây golden set 20 case** — 10 câu hỏi thật lấy nguyên văn từ chatlog, 10 case tự cài bẫy, phủ 4 lớp chỗ khó.
4. **Viết `run_eval.py`** để chạy cả bộ và chấm tự động, thay vì chấm tay.
5. **Chạy lượt đo và ghi kết quả** kèm log thô để ai cũng kiểm lại được.

## 2. Sai lầm lớn nhất của tôi trong dự án này

Bản golden set đầu tiên của tôi **không đo được gì cả** — và tôi mất khá lâu mới nhận ra.

Tôi viết 20 case dựa trên trí nhớ về nội dung buổi học: "slide có nói về Dogfooding", "chỗ nào đó có System 1 và System 2", "trang 1 nói 70% là con người". Rồi tôi gán `page` và `expected_keywords` theo phỏng đoán đó.

Khi viết script và kiểm tra lại bằng cách trích text thật từ file PDF, kết quả là:

| | |
|---|---|
| Case `HAPPY_PATH` có từ khoá thật sự nằm trong trang được gán | **1 / 12** |
| Case còn lại | từ khoá **không tồn tại** ở bất kỳ trang nào trong cả hai bộ slide |

Ví dụ tôi gán case "Dogfooding" vào Day 2 trang 5. Trang 5 thật sự nói về ba case Cursor / Artifact / NotebookLM. Từ "Dogfooding" không xuất hiện ở đâu trong 58 trang slide.

Hệ quả nếu tôi không phát hiện: tutor được đưa ngữ cảnh trang 5 và bị hỏi về Dogfooding thì hành vi **đúng** của nó là từ chối — nhưng golden set của tôi lại ghi kỳ vọng là `HAPPY_PATH`. Tức là **tôi sẽ chấm FAIL cho đúng cái hành vi mà cả nhóm đang cố xây dựng.** Con số đo ra sẽ vừa sai vừa ngược dấu.

Cái đáng sợ hơn con số sai: bảng kết quả đầu tiên tôi làm có 18/20 PASS, 90%, hallucination 0%. Nó nhìn rất đẹp và rất thuyết phục. Nếu tôi không đi kiểm text PDF, nhóm sẽ mang một bảng số hoàn toàn không có thật lên demo, và tôi sẽ không giải thích nổi ở CP5 vì tôi cũng không biết nó từ đâu ra.

## 3. Tôi sửa thế nào

Xây lại golden set từ dữ liệu chứ không từ trí nhớ:

- Trích text từng trang của cả hai file PDF bằng `pdftotext`.
- 10 case đầu lấy **nguyên văn** câu hỏi học viên từ `chat_history_anonymized_for_hackathon.csv`, giữ cả lỗi chính tả và câu không dấu (`toi nen lam gi voi no`, `Giải thích sờ lai này cho bò cũng hiểu được`), mỗi case ghi `source_ref` là mã turn để truy ngược.
- 10 case sau tự viết, nhưng chỉ được đặt vào trang mà nội dung **thật sự** ở đó.
- Thêm một bước kiểm tự động: mọi `expected_keywords` của case `HAPPY_PATH` phải xuất hiện trong text trang tương ứng, nếu không thì báo lỗi. Hiện tại: **0/13 case vi phạm**.
- Bản cũ không xoá, chuyển vào `eval/archive/` để người chấm thấy được chuỗi quyết định.

Tôi cũng đổi cách chấm: bỏ chấm tay, viết grader rule-based trong `run_eval.py`. Grader không dùng AI để chấm AI — vì AI chấm AI có xu hướng tự khen, và tôi không muốn lặp lại đúng cái sai vừa rồi ở tầng khác.

## 4. Hai quyết định kỹ thuật tôi phải giải thích được

**Ghi kết quả từng case ngay lập tức, không đợi chạy xong.** Key free tier bị 429 liên tục. Nếu ghi file một lần ở cuối, mỗi lần dính quota là mất sạch. Bây giờ mỗi case xong là ghi ngay vào `run{N}_raw.json`, chạy lại thì bỏ qua case đã có. Đổi lại là I/O nhiều hơn — với 20 case thì không đáng kể, và nó biến việc "hết quota" từ tai nạn thành chuyện bình thường.

**System prompt chỉ tồn tại ở một chỗ về mặt nội dung.** `codebase/app.js` và `eval/run_eval.py` dùng đúng một prompt, có comment ghi rõ sửa bên này phải sửa bên kia. Lý do: nếu hai bên lệch nhau thì con số trong `eval/` không còn nói gì về sản phẩm đang chạy — nó đo một hệ thống khác. Đây là điểm yếu còn lại của tôi: hiện vẫn là hai bản copy (một JS, một Python), giữ đồng bộ bằng kỷ luật chứ không bằng cơ chế. Nếu có thêm thời gian tôi sẽ tách prompt ra một file dùng chung.

## 5. Điều tôi mang đi

Trước đây tôi nghĩ đo lường là bước cuối: làm xong sản phẩm rồi mới kiểm tra. Lần này tôi thấy ngược lại — **bộ đo sai thì tệ hơn không đo**, vì nó tạo ra sự tự tin giả. Nhóm sẽ tin vào con số 90% và không sửa gì nữa.

Cụ thể hơn, bài học là: một test case chỉ có giá trị khi **ground truth của nó được kiểm chứng độc lập với người viết test**. Tôi vừa viết case vừa tự quyết định đáp án đúng dựa trên trí nhớ của chính mình — thì test đó chỉ đo được trí nhớ của tôi, không đo được sản phẩm. Bước `pdftotext` rồi so từ khoá là thứ rẻ tiền nhất tôi có thể làm để phá vòng lặp đó, và lẽ ra phải làm ngay từ đầu.

Slide Day 2 trang 7 gọi tên đúng cái tôi vừa mắc: **"No evaluation — không thiết lập kịch bản kiểm thử, chỉ số đo lường hoặc phương án đối chứng."** Tôi có kịch bản kiểm thử, có chỉ số, nhưng không có phương án đối chứng cho chính bộ kiểm thử. Mắc anti-pattern ngay trong lúc học về anti-pattern — đó là thứ tôi sẽ nhớ lâu nhất.
