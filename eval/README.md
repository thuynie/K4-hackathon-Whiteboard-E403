# `eval/` — Golden set & lượt đo

Thư mục này là bằng chứng cho **R4 · Kiểm thử (15 điểm)**. Mọi con số trong báo cáo
đều sinh tự động từ lời gọi AI thật, log thô giữ nguyên để đối chiếu.

| File | Vai trò |
|---|---|
| `golden_set.json` | 20 case kiểm thử — 10 câu hỏi thật từ chatlog + 10 case cài bẫy |
| `run_eval.py` | Chạy toàn bộ golden set qua Gemini API, chấm tự động, xuất báo cáo |
| `results_run{N}_auto.md` | Báo cáo lượt đo N (do script sinh, **không sửa tay**) |
| `run{N}_raw.json` | Log thô: prompt, câu trả lời nguyên văn, kết quả chấm từng case |
| `archive/` | Bản golden set v1 và báo cáo v1 — giữ lại để truy vết, **không dùng để chấm** |

---

## 1. Chạy lượt đo

```bash
# 1. Đặt API key (KHÔNG commit key vào repo)
export GEMINI_API_KEY="AIza..."          # macOS / Linux
$env:GEMINI_API_KEY="AIza..."            # Windows PowerShell

# 2. Kiểm tra logic chấm trước, không tốn quota
python eval/run_eval.py --dry-run

# 3. Chạy thật lượt 1
python eval/run_eval.py --run 1
```

Kết quả in ra màn hình + ghi vào `results_run1_auto.md` và `run1_raw.json`.

## 2. Gặp lỗi 429 (Too Many Requests) thì làm gì?

429 = vượt hạn mức free tier. Script đã xử lý sẵn ba lớp:

1. **Tự chờ và thử lại** — đọc `retryDelay` do Google trả về, backoff 5s → 10s → 20s...
2. **Nghỉ giữa các request** — mặc định 6 giây/case. Vẫn 429 thì tăng lên:
   ```bash
   python eval/run_eval.py --run 1 --delay 15
   ```
3. **Resume** — mỗi case xong là ghi ngay vào `run1_raw.json`. Chạy lại cùng lệnh
   sẽ **bỏ qua case đã xong**, không tốn quota lần hai. Hết quota giữa chừng thì
   chờ vài phút rồi chạy lại đúng lệnh đó.

Các cách khác:

```bash
python eval/run_eval.py --list-models          # xem key của mình dùng được model nào
python eval/run_eval.py --model gemini-2.0-flash-lite   # model nhẹ, hạn mức thoáng hơn
python eval/run_eval.py --only case-09,case-20 # chạy lại vài case
python eval/run_eval.py --run 2 --fresh        # lượt 2, chạy lại từ đầu
```

> Nếu lỗi là **404** chứ không phải 429: model đã bị gỡ. Chạy `--list-models` rồi
> chọn tên còn sống. `gemini-1.5-flash` là model cũ và có thể không còn dùng được.

## 3. Golden set được xây thế nào

**20 case, chia hai nguồn:**

- **10 case từ chatlog thật** (`source: chatlog_anonymized`) — copy nguyên văn câu hỏi
  của học viên, có `source_ref` là mã turn (vd. `T0251`) để truy ngược về
  `data/vlearn-pack/chatlog/`. Giữ nguyên cả lỗi chính tả, câu không dấu và tiếng lóng,
  vì đó chính là input thật mà tutor phải chịu.
- **10 case cài bẫy** (`source: synthetic_edge_case`) — tự viết để phủ các chỗ khó
  mà chatlog không có đủ mẫu.

**4 lớp chỗ khó:**

| Lớp | Số case | Hành vi kỳ vọng |
|---|:---:|---|
| ① Nguồn sự thật | 7 | `HAPPY_PATH` — trả lời đúng + trích `[Trang N]` |
| ② Mơ hồ | 3 | `LOW_CONFIDENCE_REFUSAL` — hỏi lại làm rõ, không đoán |
| ③ Ngoài phạm vi | 4 | `OUT_OF_SCOPE_REFUSAL` — từ chối, không bịa |
| ④ Thuật ngữ domain AI | 6 | `HAPPY_PATH` — giải thích đúng thuật ngữ theo cách slide dùng |

**Nguyên tắc quan trọng:** mọi `expected_keywords` của case `HAPPY_PATH` đều đã được
kiểm tra là **có thật trong text của đúng trang PDF đó**. Nếu từ khoá không tồn tại
trong slide thì case đó không đo được gì cả — AI trả lời kiểu nào cũng sai. Đây là
lỗi của golden set v1 (xem `archive/`) và là lý do phải xây lại.

Kiểm tra lại bất cứ lúc nào:

```bash
python - <<'EOF'
import sys, json; sys.path.insert(0,'eval')
from run_eval import extract_page_text
cache={}
for c in json.load(open('eval/golden_set.json')):
    if c['expected_behavior'] != 'HAPPY_PATH': continue
    t = extract_page_text(c['deck'], c['page'], cache).lower()
    miss = [k for k in c['expected_keywords'] if k.lower() not in t]
    if miss: print('!!', c['id'], 'từ khoá không có trong slide:', miss)
print('xong')
EOF
```

## 4. Grader chấm như thế nào

Rule-based, không dùng AI chấm AI (tránh vòng lặp tự khen).

- `HAPPY_PATH` → PASS khi **có trích dẫn `[Trang N]` đúng số trang** VÀ khớp **≥50%**
  `expected_keywords` VÀ không từ chối nhầm.
- `LOW_CONFIDENCE_REFUSAL` → PASS khi có dấu hiệu **hỏi lại làm rõ** VÀ hỏi lại sớm
  (câu hỏi nằm ở dòng đầu, hoặc toàn bộ phản hồi ≤320 ký tự).
- `OUT_OF_SCOPE_REFUSAL` → PASS khi có dấu hiệu **từ chối rõ ràng**. Không từ chối
  được tính là **hallucination**.

Grader chấm chặt hơn người thật ở vài case (vd. AI trả lời đúng ý nhưng diễn đạt
khác từ khoá). Các case đó vẫn ghi FAIL nguyên trạng — đọc `run{N}_raw.json` để
biết AI thực sự trả lời gì rồi phân tích trong phần "case chưa đạt", **không sửa điểm**.

## 5. Bảo mật

- Không hard-code API key trong bất kỳ file nào. Key đọc từ biến môi trường.
- `run{N}_raw.json` chỉ chứa câu hỏi + câu trả lời, không chứa key.
- Golden set trích **mã turn** (`T0251`) thay vì dán nguyên văn hội thoại dài,
  theo quy định bảo mật data pack trong `README.md` gốc.
