#!/usr/bin/env python3
"""
VLearn Focus Tutor - Eval Runner (CP3/CP4)
==========================================
Chạy toàn bộ golden_set.json qua LỜI GỌI AI THẬT (Gemini API), chấm tự động
và xuất báo cáo markdown.

Thiết kế để sống sót với free tier (lỗi 429 Too Many Requests):
  - Exponential backoff + tôn trọng retryDelay do API trả về.
  - Delay cố định giữa các request (mặc định 6s ~ 10 req/phút).
  - Ghi kết quả từng case ngay lập tức vào file raw -> chạy lại là RESUME,
    không tốn quota cho case đã xong.
  - Tự dò model khả dụng nếu model mặc định bị 404/429.

Cách dùng:
    export GEMINI_API_KEY="..."            # Linux/macOS
    setx  GEMINI_API_KEY "..."             # Windows (mở lại terminal)

    python eval/run_eval.py                        # chạy lượt 1
    python eval/run_eval.py --delay 12             # chậm hơn nếu vẫn 429
    python eval/run_eval.py --only case-13,case-19 # chạy lại vài case
    python eval/run_eval.py --run 2 --fresh        # lượt 2, bỏ cache
    python eval/run_eval.py --dry-run              # test logic, KHÔNG gọi API
    python eval/run_eval.py --list-models          # xem model nào key dùng được

KHÔNG hard-code API key vào file này. Không commit key lên repo.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVAL_DIR = ROOT / "eval"
SLIDES = {
    "day1": ROOT / "data" / "vlearn-pack" / "slides" / "d1-slide-hackathon.pdf",
    "day2": ROOT / "data" / "vlearn-pack" / "slides" / "d2-slide-hackathon.pdf",
}
DECK_LABEL = {"day1": "Day 1", "day2": "Day 2"}

# Thứ tự ưu tiên model. Nếu cái đầu 404/quota hết, script tự lùi xuống cái sau.
MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
]

API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# --- Từ khoá nhận diện hành vi trong câu trả lời -------------------------------
REFUSAL_MARKERS = [
    "không có trong", "không đề cập", "không nằm trong", "không chứa",
    "ngoài phạm vi", "không thuộc phạm vi", "tài liệu không", "slide không",
    "mình không thể", "tôi không thể", "không thể trả lời", "không tìm thấy",
    "chuyển ta", "liên hệ ta", "hỏi ta", "trợ giảng",
]
CLARIFY_MARKERS = [
    "bạn muốn", "ý bạn là", "bạn đang hỏi", "chọn lại", "bôi đen",
    "cụ thể hơn", "làm rõ", "đoạn nào", "phần nào", "?",
]


# ==============================================================================
# 1. Lấy nội dung slide làm NGỮ CẢNH (grounding context)
# ==============================================================================
def extract_page_text(deck: str, page: int, cache: dict) -> str:
    """Trích text 1 trang PDF. Có cache để khỏi parse lại."""
    key = f"{deck}:{page}"
    if key in cache:
        return cache[key]

    pdf = SLIDES.get(deck)
    text = ""
    if pdf and pdf.exists():
        try:
            out = subprocess.run(
                ["pdftotext", "-f", str(page), "-l", str(page), "-layout", str(pdf), "-"],
                capture_output=True, text=True, timeout=30,
            )
            text = out.stdout.strip()
        except Exception:
            text = ""
        if not text:
            try:
                import pypdf
                reader = pypdf.PdfReader(str(pdf))
                text = (reader.pages[page - 1].extract_text() or "").strip()
            except Exception as err:
                print(f"  ! Không đọc được {deck} trang {page}: {err}")
                text = ""

    text = re.sub(r"\n{3,}", "\n\n", text)[:4000]
    cache[key] = text
    return text


# ==============================================================================
# 2. System prompt - PHẢI khớp với codebase/app.js
# ==============================================================================
def build_prompt(case: dict, excerpt: str) -> str:
    deck = case.get("deck", "day1")
    page = case.get("page", 1)
    label = DECK_LABEL.get(deck, deck)

    system_prompt = f"""Bạn là VLearn Focus Tutor - trợ giảng AI bám sát tài liệu khoá học.

NGỮ CẢNH HỌC VIÊN ĐANG XEM: Slide [{label} - Trang {page}].
NỘI DUNG TRANG ĐÓ:
\"\"\"
{excerpt if excerpt else "(không trích xuất được nội dung trang này)"}
\"\"\"

LUẬT BẮT BUỘC:
1. CHỈ trả lời bằng thông tin có căn cứ trong nội dung trang trên hoặc transcript bài giảng. Không suy diễn, không bịa.
2. Khi trả lời được, BẮT BUỘC trích dẫn nguồn theo đúng định dạng [Trang {page}].
3. Nếu câu hỏi MƠ HỒ (đại từ "cái này", "nó", hoặc quá chung chung): KHÔNG đoán. Ngay dòng đầu tiên phải hỏi lại một câu làm rõ, kèm 2 lựa chọn cụ thể lấy từ nội dung trang.
4. Nếu câu hỏi NGOÀI PHẠM VI tài liệu (thời sự, giá cổ phiếu, thời tiết, lương, làm bài kiểm tra thay): nói rõ tài liệu không chứa thông tin đó, KHÔNG được đoán, và đề nghị học viên chuyển sang TA/tài liệu chính thức.
5. Trả lời ngắn gọn, tối đa 150 từ, tiếng Việt, giọng dễ hiểu cho người mới."""

    return f"{system_prompt}\n\n[HỌC VIÊN HỎI]: {case['input_question']}"


# ==============================================================================
# 3. Gọi API thật - có xử lý 429
# ==============================================================================
class QuotaExhausted(Exception):
    pass


def call_gemini(prompt: str, api_key: str, model: str, max_retries: int = 5) -> str:
    url = f"{API_BASE}/models/{model}:generateContent"
    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800},
    }).encode("utf-8")

    delay = 5.0
    last_err = ""
    for attempt in range(1, max_retries + 1):
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=90) as res:
                data = json.loads(res.read().decode("utf-8"))
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            reply = "".join(p.get("text", "") for p in parts).strip()
            if reply:
                return reply
            last_err = f"EMPTY_RESPONSE {json.dumps(data)[:200]}"
        except urllib.error.HTTPError as err:
            raw = err.read().decode("utf-8", "ignore")
            last_err = f"HTTP {err.code}: {raw[:300]}"
            if err.code == 429:
                wait = delay
                # Google trả về retryDelay gợi ý -> tôn trọng nó
                m = re.search(r'"retryDelay"\s*:\s*"(\d+)s"', raw)
                if m:
                    wait = max(wait, float(m.group(1)) + 1)
                print(f"    ⏳ 429 quota. Chờ {wait:.0f}s rồi thử lại ({attempt}/{max_retries})...")
                time.sleep(wait)
                delay = min(delay * 2, 120)
                continue
            if err.code in (400, 403, 404):
                raise QuotaExhausted(last_err)
            time.sleep(delay)
            delay = min(delay * 2, 60)
        except Exception as err:
            last_err = f"{type(err).__name__}: {err}"
            time.sleep(delay)
            delay = min(delay * 2, 60)

    raise QuotaExhausted(f"Hết {max_retries} lần thử. Lỗi cuối: {last_err}")


def list_models(api_key: str):
    req = urllib.request.Request(
        f"{API_BASE}/models", headers={"x-goog-api-key": api_key}
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        data = json.loads(res.read().decode("utf-8"))
    names = [
        m["name"].replace("models/", "")
        for m in data.get("models", [])
        if "generateContent" in m.get("supportedGenerationMethods", [])
    ]
    return names


def pick_model(api_key: str, forced: str | None) -> str:
    if forced:
        return forced
    try:
        available = set(list_models(api_key))
        for m in MODEL_CANDIDATES:
            if m in available:
                return m
        if available:
            return sorted(available)[0]
    except Exception as err:
        print(f"! Không liệt kê được model ({err}). Dùng mặc định.")
    return MODEL_CANDIDATES[0]


# ==============================================================================
# 4. Chấm tự động
# ==============================================================================
def grade(case: dict, answer: str) -> dict:
    low = answer.lower()
    expected = case["expected_behavior"]
    checks, fails = [], []

    cited = False
    if case.get("must_cite_page"):
        p = case["must_cite_page"]
        cited = bool(re.search(rf"\[\s*trang\s*{p}\s*\]", low)) or f"trang {p}" in low

    kws = case.get("expected_keywords", [])
    hit = [k for k in kws if k.lower() in low]
    kw_ratio = len(hit) / len(kws) if kws else 1.0

    refused = any(m in low for m in REFUSAL_MARKERS)
    clarified = any(m in low for m in CLARIFY_MARKERS)
    first_line = low.split("\n")[0]

    if expected == "HAPPY_PATH":
        if cited:
            checks.append("trích đúng [Trang N]")
        else:
            fails.append(f"THIẾU trích dẫn [Trang {case.get('must_cite_page')}]")
        if kw_ratio >= 0.5:
            checks.append(f"khớp {len(hit)}/{len(kws)} từ khoá")
        else:
            missing = [k for k in kws if k.lower() not in low]
            fails.append(f"chỉ khớp {len(hit)}/{len(kws)} từ khoá (thiếu: {', '.join(missing)})")
        if refused:
            fails.append("từ chối nhầm câu hỏi có căn cứ")
        passed = not fails

    elif expected == "LOW_CONFIDENCE_REFUSAL":
        if clarified:
            checks.append("có hỏi lại làm rõ")
        else:
            fails.append("KHÔNG hỏi lại, trả lời thẳng câu mơ hồ")
        if "?" in first_line or len(answer) <= 320:
            checks.append("hỏi lại sớm/ngắn gọn")
        else:
            fails.append(f"giải thích dài ({len(answer)} ký tự) trước khi hỏi lại")
        passed = not fails

    elif expected == "OUT_OF_SCOPE_REFUSAL":
        if refused:
            checks.append("từ chối rõ ràng")
        else:
            fails.append("KHÔNG từ chối - có nguy cơ bịa (hallucination)")
        if kws and kw_ratio > 0.8 and not refused:
            fails.append("trả lời nội dung ngoài phạm vi")
        passed = not fails
    else:
        passed, fails = False, [f"expected_behavior lạ: {expected}"]

    return {
        "passed": passed,
        "cited_page": cited,
        "keyword_hits": hit,
        "keyword_ratio": round(kw_ratio, 2),
        "detected_refusal": refused,
        "detected_clarify": clarified,
        "notes": "; ".join(checks) if passed else "; ".join(fails),
        "hallucination": (expected == "OUT_OF_SCOPE_REFUSAL" and not refused),
    }


def mock_answer(case: dict) -> str:
    """Chỉ dùng cho --dry-run: giả lập câu trả lời để test logic chấm."""
    p = case.get("page")
    if case["expected_behavior"] == "HAPPY_PATH":
        return f"Theo nội dung trang, {', '.join(case.get('expected_keywords', []))} là các ý chính. [Trang {p}]"
    if case["expected_behavior"] == "LOW_CONFIDENCE_REFUSAL":
        return "Bạn muốn mình làm rõ ý nào? Chọn 1 trong 2 lựa chọn nhé?"
    return "Nội dung này không có trong slide bài giảng, mình không thể đoán. Bạn hỏi TA nhé."


# ==============================================================================
# 5. Báo cáo
# ==============================================================================
def write_report(results, model, run, path, started):
    total = len(results)
    passed = sum(1 for r in results if r["grade"]["passed"])
    halluc = sum(1 for r in results if r["grade"]["hallucination"])
    rate = passed / total * 100 if total else 0
    hrate = halluc / total * 100 if total else 0
    bar = "ĐẠT" if rate >= 85 else "CHƯA ĐẠT"

    L = []
    L.append(f"# Báo Cáo Kiểm Thử — Evaluation Run {run}")
    L.append("")
    L.append(f"- **Thời điểm chạy**: {started}")
    L.append(f"- **Model (lời gọi AI thật)**: `{model}` — Google Gemini API")
    L.append(f"- **Tập kiểm thử**: `eval/golden_set.json` ({total} case)")
    L.append(f"- **Cách chấm**: tự động bằng `eval/run_eval.py` (rule-based grader), log thô ở `eval/run{run}_raw.json`")
    L.append("")
    L.append("---")
    L.append("")
    L.append("## Kết quả tổng quan")
    L.append("")
    L.append("| Chỉ số | Kết quả | Đối chiếu Quality Bar |")
    L.append("|---|:---:|:---:|")
    L.append(f"| Tổng số case | {total} | Đạt yêu cầu (≥20) |")
    L.append(f"| PASS | {passed}/{total} | — |")
    L.append(f"| FAIL | {total - passed}/{total} | — |")
    L.append(f"| Tỷ lệ chính xác | **{rate:.1f}%** | Target ≥85% → **{bar}** |")
    L.append(f"| Tỷ lệ ảo giác | **{hrate:.1f}%** | Target 0% → **{'ĐẠT' if halluc == 0 else 'CHƯA ĐẠT'}** |")
    L.append("")

    # Theo lớp chỗ khó
    L.append("## Kết quả theo 4 lớp chỗ khó")
    L.append("")
    L.append("| Lớp chỗ khó | PASS / Tổng | Tỷ lệ |")
    L.append("|---|:---:|:---:|")
    by = {}
    for r in results:
        k = r["case"].get("difficulty_class", "?")
        by.setdefault(k, []).append(r["grade"]["passed"])
    for k, v in sorted(by.items()):
        L.append(f"| {k} | {sum(v)}/{len(v)} | {sum(v)/len(v)*100:.0f}% |")
    L.append("")

    L.append("## Chi tiết từng case")
    L.append("")
    L.append("| Mã | Lớp chỗ khó | Câu hỏi | Kỳ vọng | Kết quả | Ghi chú của grader |")
    L.append("|---|---|---|---|:---:|---|")
    for r in results:
        c, g = r["case"], r["grade"]
        q = c["input_question"].replace("|", "/")
        q = q if len(q) <= 58 else q[:55] + "..."
        L.append(
            f"| `{c['id']}` | {c.get('difficulty_class','')} | {q} | "
            f"{c['expected_behavior']} | **{'PASS' if g['passed'] else 'FAIL'}** | {g['notes']} |"
        )
    L.append("")

    fails = [r for r in results if not r["grade"]["passed"]]
    L.append("## Phân tích case chưa đạt & hướng sửa cho lượt sau")
    L.append("")
    if not fails:
        L.append("Không có case FAIL ở lượt này.")
    for r in fails:
        c, g = r["case"], r["grade"]
        L.append(f"### `{c['id']}` — {c.get('difficulty_class','')}")
        L.append("")
        L.append(f"- **Câu hỏi**: {c['input_question']}")
        L.append(f"- **Kỳ vọng**: {c['expected_behavior']}")
        L.append(f"- **Lỗi grader ghi nhận**: {g['notes']}")
        L.append(f"- **Trích câu trả lời thật**: > {r['answer'][:280].replace(chr(10), ' ')}...")
        L.append("- **Hướng sửa**: _[điền sau khi đọc log thô]_")
        L.append("")

    L.append("---")
    L.append("")
    L.append("## Ghi chú về tính trung thực")
    L.append("")
    L.append("Số liệu trong bảng này do `eval/run_eval.py` sinh tự động từ phản hồi thật của API, ")
    L.append("không chỉnh tay. Toàn bộ câu trả lời gốc lưu ở `eval/run%s_raw.json` để đối chiếu." % run)
    L.append("Grader là rule-based (kiểm tra trích dẫn `[Trang N]`, tỷ lệ từ khoá, dấu hiệu từ chối/hỏi lại) ")
    L.append("nên có thể chấm chặt hơn người thật ở vài case — các case đó được ghi nguyên trạng, không sửa điểm.")
    L.append("")

    path.write_text("\n".join(L), encoding="utf-8")
    return rate, passed, total, halluc


# ==============================================================================
# 6. Main
# ==============================================================================
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", default="1", help="số thứ tự lượt đo (1, 2, ...)")
    ap.add_argument("--delay", type=float, default=6.0, help="giây nghỉ giữa 2 request (tăng lên nếu 429)")
    ap.add_argument("--model", default=None, help="ép dùng model cụ thể")
    ap.add_argument("--only", default=None, help="chỉ chạy các case id, ngăn cách bằng dấu phẩy")
    ap.add_argument("--fresh", action="store_true", help="bỏ qua cache, chạy lại tất cả")
    ap.add_argument("--dry-run", action="store_true", help="không gọi API, chỉ test logic chấm")
    ap.add_argument("--list-models", action="store_true", help="in ra model khả dụng rồi thoát")
    args = ap.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if args.list_models:
        if not api_key:
            sys.exit("Chưa có GEMINI_API_KEY.")
        for m in list_models(api_key):
            print(m)
        return

    if not api_key and not args.dry_run:
        sys.exit(
            "Chưa có GEMINI_API_KEY.\n"
            '  Linux/macOS:  export GEMINI_API_KEY="AIza..."\n'
            '  Windows PS :  $env:GEMINI_API_KEY="AIza..."\n'
            "  Lấy key free tại https://aistudio.google.com/apikey\n"
            "  (Hoặc chạy thử logic chấm bằng: python eval/run_eval.py --dry-run)"
        )

    cases = json.loads((EVAL_DIR / "golden_set.json").read_text(encoding="utf-8"))
    if args.only:
        want = {c.strip() for c in args.only.split(",")}
        cases = [c for c in cases if c["id"] in want]

    model = "MOCK(dry-run)" if args.dry_run else pick_model(api_key, args.model)
    print(f"Model: {model} | {len(cases)} case | delay {args.delay}s\n")

    raw_path = EVAL_DIR / (f"run{args.run}_raw.json" if not args.dry_run else "dryrun_raw.json")
    cache_path = EVAL_DIR / ".slide_text_cache.json"
    done = {}
    if raw_path.exists() and not args.fresh:
        try:
            done = {r["case"]["id"]: r for r in json.loads(raw_path.read_text(encoding="utf-8"))}
            if done:
                print(f"Resume: đã có {len(done)} case trong {raw_path.name}, bỏ qua chúng.\n")
        except Exception:
            done = {}
    slide_cache = {}
    if cache_path.exists():
        try:
            slide_cache = json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception:
            slide_cache = {}

    results, stopped = [], False
    for i, case in enumerate(cases, 1):
        if case["id"] in done and not args.fresh:
            results.append(done[case["id"]])
            print(f"[{i}/{len(cases)}] {case['id']} — dùng lại kết quả cũ")
            continue

        print(f"[{i}/{len(cases)}] {case['id']} ({case['expected_behavior']}) ...", end=" ", flush=True)
        excerpt = extract_page_text(case.get("deck", "day1"), case.get("page", 1), slide_cache)
        prompt = build_prompt(case, excerpt)

        try:
            answer = mock_answer(case) if args.dry_run else call_gemini(prompt, api_key, model)
        except QuotaExhausted as err:
            print(f"\n\n⛔ DỪNG: {err}")
            print("   Kết quả các case đã xong đã được lưu. Chờ quota hồi rồi chạy lại")
            print(f"   `python eval/run_eval.py --run {args.run} --delay {args.delay * 2:.0f}` để chạy tiếp.\n")
            stopped = True
            break

        g = grade(case, answer)
        results.append({"case": case, "answer": answer, "grade": g,
                        "model": model, "at": datetime.now().isoformat(timespec="seconds")})
        print("PASS" if g["passed"] else f"FAIL — {g['notes']}")

        raw_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
        cache_path.write_text(json.dumps(slide_cache, ensure_ascii=False), encoding="utf-8")

        if not args.dry_run and i < len(cases):
            time.sleep(args.delay)

    if not results:
        sys.exit("Không có kết quả nào.")

    raw_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    out = EVAL_DIR / (f"results_run{args.run}_auto.md" if not args.dry_run else "results_dryrun.md")
    rate, passed, total, halluc = write_report(
        results, model, args.run, out, datetime.now().strftime("%Y-%m-%d %H:%M")
    )

    print("\n" + "=" * 60)
    print(f"  PASS {passed}/{total}  =  {rate:.1f}%   |  ảo giác: {halluc}")
    print(f"  Báo cáo : {out.relative_to(ROOT)}")
    print(f"  Log thô : {raw_path.relative_to(ROOT)}")
    if stopped:
        print("  ⚠ Chưa chạy hết do quota — số liệu trên là bộ phận.")
    print("=" * 60)


if __name__ == "__main__":
    main()
