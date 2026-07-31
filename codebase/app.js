import * as pdfjsLib from "./vendor/pdfjs/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;

const selection = document.querySelector("#selection");
const askSelection = document.querySelector("#askSelection");
const slideCanvas = document.querySelector("#slideCanvas");
const slideLoading = document.querySelector("#slideLoading");
const pdfFrame = document.querySelector("#pdfFrame");
const pdfPage = document.querySelector("#pdfPage");
const textLayerDiv = document.querySelector("#textLayer");
const thumbnailList = document.querySelector("#thumbnailList");
const deckSwitcher = document.querySelector(".deck-switcher");
const viewerTitle = document.querySelector("#viewerTitle");
const courseEyebrow = document.querySelector("#courseEyebrow");
const courseTitle = document.querySelector("#courseTitle");
const headerPageLabel = document.querySelector("#headerPageLabel");
const progressFill = document.querySelector("#progressFill");
const currentPageLabel = document.querySelector("#currentPageLabel");
const previousPage = document.querySelector("#previousPage");
const nextPage = document.querySelector("#nextPage");
const selectionLabel = document.querySelector("#selectionLabel");
const contextChip = document.querySelector("#contextChip");
const contextTitle = document.querySelector("#contextTitle");
const contextText = document.querySelector("#contextText");
const clearContext = document.querySelector("#clearContext");
const suggestions = document.querySelector("#suggestions");
const question = document.querySelector("#question");
const sendButton = document.querySelector("#sendButton");
const composer = document.querySelector("#composer");
const messages = document.querySelector("#messages");
const welcome = document.querySelector("#welcome");
const resetButton = document.querySelector("#resetButton");
const citationDialog = document.querySelector("#citationDialog");
const closeDialog = document.querySelector("#closeDialog");
const backToChat = document.querySelector("#backToChat");
const dialogSlideSource = document.querySelector("#dialogSlideSource");
const dialogExcerpt = document.querySelector("#dialogExcerpt");
const transcriptSource = document.querySelector("#transcriptSource");

const decks = {
  day1: {
    label: "Day 1",
    title: "AI & LLM Foundation",
    file: "../data/vlearn-pack/slides/d1-slide-hackathon.pdf"
  },
  day2: {
    label: "Day 2",
    title: "Xác định bài toán cho AI",
    file: "../data/vlearn-pack/slides/d2-slide-hackathon.pdf"
  }
};

let activeDeckKey = "day1";
let pdfDocument;
let currentPage = 12;
let selectedExcerpt = "Mỗi token mới được nối vào ngữ cảnh, rồi model chạy lại từ đầu — vòng lặp predict → append → rerun.";
let hasContext = false;

function compactText(text, limit = 210) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > limit ? `${cleaned.slice(0, limit).trim()}…` : cleaned;
}

// Dựng lớp chữ trong suốt phủ lên canvas -> bôi đen bằng chuột hoạt động thật.
async function renderTextLayer(page, viewport, scale) {
  if (!textLayerDiv) return;
  textLayerDiv.replaceChildren();
  textLayerDiv.style.width = `${viewport.width}px`;
  textLayerDiv.style.height = `${viewport.height}px`;
  // PDF.js đọc biến CSS này để đặt font-size cho từng span
  textLayerDiv.style.setProperty("--scale-factor", scale);
  textLayerDiv.style.setProperty("--total-scale-factor", scale);

  try {
    const layer = new pdfjsLib.TextLayer({
      textContentSource: page.streamTextContent(),
      container: textLayerDiv,
      viewport
    });
    await layer.render();

    // Vùng "endOfContent" của PDF.js giúp kéo chọn mượt tới cuối trang
    const end = document.createElement("div");
    end.className = "endOfContent";
    textLayerDiv.append(end);
  } catch (err) {
    console.warn("Không dựng được lớp chữ, trang này chỉ bôi đen được ở khay bên dưới:", err);
  }
}

async function pageText(page) {
  if (activeDeckKey === "day1" && currentPage === 12) {
    return "Mỗi token mới được nối vào ngữ cảnh, rồi model chạy lại từ đầu — vòng lặp predict → append → rerun.";
  }
  const text = await page.getTextContent();
  // Khối nội dung trang giờ là "tóm tắt slide" và có thể cuộn,
  // nên lấy nhiều chữ hơn thay vì cắt ở 210 ký tự như trước.
  return compactText(text.items.map((item) => item.str).join(" "), 900);
}

// Tính scale để trang vừa khung, thay vì fix cứng 1.55 rồi để CSS co ảnh lại.
// Bắt buộc phải làm vậy: lớp chữ (textLayer) định vị theo toạ độ viewport,
// nếu CSS co canvas mà viewport không đổi thì chữ sẽ lệch khỏi hình.
function fitScale(page) {
  const base = page.getViewport({ scale: 1 });
  const w = (pdfFrame?.clientWidth || 900) - 24;
  const h = (pdfFrame?.clientHeight || 560) - 24;
  return Math.max(0.2, Math.min(w / base.width, h / base.height));
}

let renderToken = 0;

async function renderPage(pageNumber) {
  if (!pdfDocument) return;
  currentPage = Math.max(1, Math.min(pageNumber, pdfDocument.numPages));
  slideLoading.hidden = false;
  setContext(false);

  const token = ++renderToken;
  const page = await pdfDocument.getPage(currentPage);
  const scale = fitScale(page);
  const viewport = page.getViewport({ scale });
  const dpr = window.devicePixelRatio || 1;

  // Canvas: vẽ ở độ phân giải màn hình (dpr) nhưng hiển thị đúng kích thước viewport
  const context = slideCanvas.getContext("2d");
  slideCanvas.width = Math.floor(viewport.width * dpr);
  slideCanvas.height = Math.floor(viewport.height * dpr);
  slideCanvas.style.width = `${viewport.width}px`;
  slideCanvas.style.height = `${viewport.height}px`;
  pdfPage.style.width = `${viewport.width}px`;
  pdfPage.style.height = `${viewport.height}px`;

  await page.render({
    canvasContext: context,
    viewport,
    transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined
  }).promise;
  if (token !== renderToken) return; // người dùng đã lật trang khác

  await renderTextLayer(page, viewport, scale);
  if (token !== renderToken) return;

  selectedExcerpt = await pageText(page);
  selection.textContent = selectedExcerpt || "Trang này chủ yếu là hình ảnh. Hãy nhập câu hỏi cụ thể cho tutor.";
  const deck = decks[activeDeckKey];
  viewerTitle.textContent = `${deck.label} · ${deck.title}`;
  courseEyebrow.textContent = `AI IN ACTION · ${deck.label.toUpperCase()}`;
  courseTitle.textContent = deck.title;
  currentPageLabel.textContent = `${currentPage} / ${pdfDocument.numPages}`;
  headerPageLabel.textContent = `${currentPage} / ${pdfDocument.numPages}`;
  progressFill.style.width = `${(currentPage / pdfDocument.numPages) * 100}%`;
  selectionLabel.textContent = `NỘI DUNG TRANG ${currentPage}`;
  contextTitle.textContent = `Đang hỏi về · ${deck.label} · Trang ${currentPage}`;
  dialogSlideSource.textContent = `📄 Slide · ${deck.label} · Trang ${currentPage}`;
  dialogExcerpt.textContent = `“${selectedExcerpt}”`;
  transcriptSource.hidden = !(activeDeckKey === "day1" && currentPage === 12);
  previousPage.disabled = currentPage === 1;
  nextPage.disabled = currentPage === pdfDocument.numPages;
  document.querySelectorAll(".thumbnail").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.page) === currentPage);
  });
  slideLoading.hidden = true;
}

async function renderThumbnails() {
  const documentForThumbnails = pdfDocument;
  thumbnailList.replaceChildren();
  for (let pageNumber = 1; pageNumber <= documentForThumbnails.numPages; pageNumber += 1) {
    if (documentForThumbnails !== pdfDocument) return;
    const button = document.createElement("button");
    button.className = "thumbnail";
    button.type = "button";
    button.dataset.page = pageNumber;
    button.innerHTML = `<canvas></canvas><span>${pageNumber}</span>`;
    button.addEventListener("click", () => renderPage(pageNumber));
    thumbnailList.appendChild(button);

    const page = await documentForThumbnails.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.18 });
    const canvas = button.querySelector("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  }
}

async function loadDeck(deckKey, startPage = 1) {
  activeDeckKey = deckKey;
  slideLoading.hidden = false;
  slideLoading.textContent = "Đang tải bộ slide…";
  deckSwitcher.querySelectorAll("[data-deck]").forEach((button) => {
    button.classList.toggle("active", button.dataset.deck === deckKey);
  });
  const pdfUrl = new URL(decks[deckKey].file, window.location.href).href;
  pdfDocument = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
  await renderPage(Math.min(startPage, pdfDocument.numPages));
  renderThumbnails();
}

function setContext(enabled) {
  hasContext = enabled;
  selection.setAttribute("aria-pressed", String(enabled));
  askSelection.hidden = true;
  contextChip.hidden = !enabled;
  suggestions.hidden = !enabled;
  question.disabled = !enabled;
  sendButton.disabled = !enabled;
  question.placeholder = enabled
    ? "Hỏi về đúng đoạn đang chọn…"
    : "Chọn một đoạn trên slide hoặc bôi đen văn bản để bắt đầu…";
  contextText.textContent = selectedExcerpt;
  if (enabled) question.focus();
}

function scrollMessages() {
  messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}

function addUserMessage(text) {
  const node = document.createElement("div");
  node.className = "message user";
  node.textContent = text;
  messages.appendChild(node);
}

function addTyping() {
  const node = document.createElement("div");
  node.className = "message typing";
  node.innerHTML = "<i></i><i></i><i></i>";
  messages.appendChild(node);
  return node;
}

function answerFor(text) {
  const normalized = text.toLowerCase();
  
  if (normalized.includes("bài giảng") || normalized.includes("toàn bộ") || normalized.includes("tóm tắt")) {
    const deck = decks[activeDeckKey];
    const totalPages = pdfDocument ? pdfDocument.numPages : (activeDeckKey === "day1" ? 29 : 24);
    
    if (activeDeckKey === "day1") {
      return {
        type: "happy",
        title: `Tổng Quan Ý Chính Bài Giảng ${deck.label} (${deck.title})`,
        body: `Bộ bài giảng ${deck.label} gồm **${totalPages} trang slide** xoay quanh các chủ đề cốt lõi:\n\n1. **Nguyên lý Next Token Prediction [Trang 1-5]**: Giải thích cách LLM dự đoán từ tiếp theo theo xác suất.\n2. **Prompt Engineering & Tokens [Trang 6-12]**: Chu trình Predict → Append → Rerun và kỹ thuật tối ưu câu lệnh.\n3. **RAG & Grounding [Trang 13-20]**: Bổ sung tri thức nguồn và phòng chống hiện tượng ảo giác (Hallucination).\n4. **Guardrails & Tối ưu Trải nghiệm [Trang 21-${totalPages}]**: Khoanh vùng câu hỏi và kiểm soát độ tự tin của AI.`,
        analogy: "💡 Bạn có thể bấm chọn từng slide cụ thể hoặc bôi đen một từ/cụm từ để hỏi chi tiết hơn nhé!"
      };
    } else {
      return {
        type: "happy",
        title: `Tổng Quan Ý Chính Bài Giảng ${deck.label} (${deck.title})`,
        body: `Bộ bài giảng ${deck.label} gồm **${totalPages} trang slide** tập trung vào phương pháp xác định bài toán AI:\n\n1. **Phân bổ Tỷ lệ Thành công 70/30 [Trang 1-2]**: 70% thuộc về con người & vận hành, 30% thuộc về công nghệ.\n2. **Tư duy Product Manager vs Project Manager [Trang 3-5]**: Định hướng bài toán theo người dùng.\n3. **Tư duy System 1 vs System 2 [Trang 6-10]**: Phản xạ nhanh vs Tư duy phân tích chuyên sâu.\n4. **Tính chất Xác suất Probabilistic [Trang 11-18]**: Quản lý kỳ vọng và chi phí chuyển đổi của bài toán AI.\n5. **Phương pháp Dogfooding & Hoàn thiện Sản phẩm [Trang 19-${totalPages}]**: Thử nghiệm nội bộ và đóng gói trải nghiệm học viên.`,
        analogy: "💡 Bấm chọn bất kỳ slide hoặc bôi đen cụm từ để Tutor giải thích sâu hơn!"
      };
    }
  }

  if (normalized.includes("hoạt động như thế nào")) {
    return {
      type: "low",
      title: "Mình cần bạn làm rõ một ý",
      body: "“Cái này” có thể là việc model chọn token theo xác suất, hoặc vòng lặp nối token rồi chạy lại. Bạn muốn làm rõ phần nào?",
      analogy: "Mình chưa giải thích ngay để tránh đoán sai ý bạn.",
      actions: ["Cách model chọn token", "Vòng lặp predict → append → rerun"]
    };
  }
  if (normalized.includes("cổ phiếu")) {
    return {
      type: "failure",
      title: "Mình không tìm thấy căn cứ trong trang này",
      body: `Trang ${currentPage} của ${decks[activeDeckKey].label} không có kết luận về mô hình tốt nhất để dự đoán giá cổ phiếu.`,
      analogy: "Mình sẽ không suy đoán thêm ngoài nội dung tài liệu.",
      actions: ["Hỏi lại về cơ chế dự đoán token", "Gửi câu này cho TA"]
    };
  }
  if (normalized.includes("đáp án bài kiểm tra")) {
    return {
      type: "failure",
      title: "Mình không thể làm bài kiểm tra thay bạn",
      body: "Mình có thể giải thích khái niệm hoặc đặt một câu hỏi để bạn tự kiểm tra mức hiểu, nhưng không tạo đáp án nộp thay.",
      analogy: "Phạm vi của tutor là hỗ trợ học đúng nội dung, không thay người học hoàn thành bài đánh giá.",
      actions: ["Giải thích lại khái niệm", "Cho mình một câu tự kiểm tra"]
    };
  }
  if (normalized.includes("nghĩa của") || normalized.includes("nghĩa là") || normalized.includes("từ này") || normalized.includes("giải thích từ") || normalized.includes("khái niệm") || normalized.includes("là gì") || normalized.includes("2 từ")) {
    const excerpt = selectedExcerpt || `Trang ${currentPage}`;
    return {
      type: "happy",
      title: `Giải thích thông minh cho thuật ngữ "${compactText(excerpt, 45)}"`,
      body: `📌 **1. Trọng tâm bài học [Trang ${currentPage}]**: Thuật ngữ **"${excerpt}"** là khái niệm cốt lõi nằm trên Slide Trang ${currentPage} thuộc bài học ${decks[activeDeckKey].title}.\n\n💡 **2. Ví dụ thực tế**: Giống như việc gán nhãn trong quy trình sản xuất, thuật ngữ này xác định đúng vai trò của đối tượng trong bài toán AI để tránh nhầm lẫn khi triển khai.\n\n🎯 **3. Tự kiểm tra**: Bạn thử nghĩ xem nếu bỏ qua khái niệm này, bài toán AI của bạn sẽ gặp rủi ro gì ở bước triển khai?`,
      analogy: `*(Nguồn trích dẫn trực tiếp từ Slide bài giảng Trang ${currentPage})*`
    };
  }

  if (normalized.includes("kiểm tra")) {
    return {
      type: "happy",
      title: "Thử kiểm tra kiến thức nhanh",
      body: "📌 **1. Trọng tâm [Trang 12]**: Sau khi model dự đoán được 1 token mới, nó thực hiện nối token đó vào chuỗi cũ (Append) rồi chạy lại toàn bộ ngữ cảnh mới (Rerun).\n\n💡 **2. Ví dụ thực tế**: Giống như bạn nối thêm 1 toa tàu mới, rồi nhìn lại cả đoàn tàu để quyết định toa tiếp theo.\n\n🎯 **3. Tự kiểm tra**: Nếu chuỗi ngữ cảnh quá dài vượt Context Window, điều gì sẽ xảy ra?",
      analogy: "Gợi ý: Hãy nhìn lại 3 bước predict → append → rerun trên slide."
    };
  }

  if (normalized.includes("ví dụ")) {
    return {
      type: "happy",
      title: "Ví dụ thực chiến với câu “Một tách…”",
      body: "📌 **1. Trọng tâm [Trang 12]**: Model chấm xác suất cho các từ tiếp theo. Nếu chọn “cà phê”, nó nối từ này thành “Một tách cà phê” rồi lặp lại dự đoán.\n\n💡 **2. Ví dụ thực tế**: Giống như trò chơi nối chữ, bạn không viết cả câu cùng lúc mà nối từng từ dựa trên bối cảnh các từ trước.\n\n🎯 **3. Tự kiểm tra**: Tại sao model lại chọn từ có xác suất cao nhất thay vì ngẫu nhiên?",
      analogy: "Điểm cốt lõi: Model lặp lại việc chọn từng token mảnh nhỏ."
    };
  }

  const excerptText = selectedExcerpt ? `“${compactText(selectedExcerpt, 120)}”` : `nội dung Trang ${currentPage}`;
  return {
    type: "happy",
    title: `Giải thích sư phạm về Trang ${currentPage}`,
    body: `📌 **1. Trọng tâm [Trang ${currentPage}]**: Dựa theo slide bài học **[Trang ${currentPage} - ${decks[activeDeckKey].label}]**, kiến thức cốt lõi là ${excerptText}.\n\n💡 **2. Bối cảnh thực tế**: Nội dung này cung cấp nguyên lý nền tảng giúp bạn hiểu cách hệ thống AI vận hành mà không bị suy đoán sai lệch.\n\n🎯 **3. Tự kiểm tra**: Bạn có thể chỉ ra 1 điểm quan trọng nhất của trang này đối với dự án của mình không?`,
    analogy: `*(Nguồn trích dẫn chuẩn xác từ Slide Trang ${currentPage})*`
  };
}

// Thứ tự thử model. Nếu model đầu bị 404 (đã gỡ) hoặc 429 (hết quota) thì lùi xuống model sau.
// Phải giữ đồng bộ với MODEL_CANDIDATES trong eval/run_eval.py.
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-lite"
];
let activeModel = null;

// System prompt DUY NHẤT của sản phẩm.
// eval/run_eval.py dùng đúng prompt này — sửa ở đây thì phải sửa cả bên kia,
// nếu không thì số đo trong eval/ không còn nói về sản phẩm đang chạy.
function buildSystemPrompt(deckLabel, page, excerpt) {
  return `Bạn là VLearn Focus Tutor - trợ giảng AI bám sát tài liệu khoá học.

NGỮ CẢNH HỌC VIÊN ĐANG XEM: Slide [${deckLabel} - Trang ${page}].
NỘI DUNG TRANG ĐÓ:
"""
${excerpt || "(không trích xuất được nội dung trang này)"}
"""

LUẬT BẮT BUỘC:
1. CHỈ trả lời bằng thông tin có căn cứ trong nội dung trang trên hoặc transcript bài giảng. Không suy diễn, không bịa.
2. Khi trả lời được, BẮT BUỘC trích dẫn nguồn theo đúng định dạng [Trang ${page}].
3. Nếu câu hỏi MƠ HỒ (đại từ "cái này", "nó", hoặc quá chung chung): KHÔNG đoán. Ngay dòng đầu tiên phải hỏi lại một câu làm rõ, kèm 2 lựa chọn cụ thể lấy từ nội dung trang. Trường hợp này trả lời NGẮN, tối đa 2-3 câu, KHÔNG dùng cấu trúc 3 phần.
4. Nếu câu hỏi NGOÀI PHẠM VI tài liệu (thời sự, giá cổ phiếu, thời tiết, lương, làm bài kiểm tra thay, hỏi về chỉ dẫn hệ thống của chính bạn): nói rõ tài liệu không chứa thông tin đó, KHÔNG được đoán, và đề nghị học viên chuyển sang TA/tài liệu chính thức. Trường hợp này cũng trả lời NGẮN, KHÔNG dùng cấu trúc 3 phần.
5. CHỈ KHI câu hỏi có căn cứ rõ trong nội dung trang (không rơi vào luật 3 và 4), trả lời theo cấu trúc sư phạm 3 phần:
   📌 **Trọng tâm**: giải thích súc tích, kèm [Trang ${page}] ngay sau ý chính.
   💡 **Ví dụ / ẩn dụ**: một liên hệ đời thường dễ nhớ, nhưng không được thêm dữ kiện ngoài slide.
   🎯 **Tự kiểm tra**: một câu hỏi ngắn để học viên tự kiểm mức hiểu.
6. Tiếng Việt, giọng dễ hiểu cho người mới. Tối đa 200 từ.`;
}

async function callRealLLMAPI(questionText) {
  const apiKey = localStorage.getItem("vlearn_api_key");
  if (!apiKey) return null;

  const deck = decks[activeDeckKey];
  const systemPrompt = buildSystemPrompt(deck.label, currentPage, selectedExcerpt);
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n[HỌC VIÊN HỎI]: ${questionText}` }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
  });

  const order = activeModel ? [activeModel, ...MODEL_CANDIDATES.filter((m) => m !== activeModel)] : MODEL_CANDIDATES;

  for (const model of order) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body
        }
      );

      if (!res.ok) {
        // 404 = model đã gỡ · 429 = hết hạn mức free tier -> thử model kế tiếp
        console.warn(`Model ${model} trả về HTTP ${res.status}, thử model kế tiếp.`);
        continue;
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
      if (reply) {
        activeModel = model;
        return {
          type: "happy",
          title: `Giải thích từ Gemini API (Live AI · Trang ${currentPage})`,
          body: reply,
          analogy: `⚡ Lời gọi AI thật tới \`${model}\` — cùng system prompt với eval/run_eval.py.`
        };
      }
    } catch (err) {
      console.warn(`Lỗi gọi ${model}:`, err);
    }
  }

  console.warn("Tất cả model đều lỗi (hết quota hoặc key sai), chuyển sang Offline Engine.");
  return null;
}

function formatMarkdownHTML(text) {
  if (!text) return "";
  let html = text;
  html = html.replace(/`/g, '');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function addTutorAnswer(text, customAnswer = null) {
  const answer = customAnswer || answerFor(text);
  const isHappy = answer.type === "happy";
  const deck = decks[activeDeckKey];
  const hasTranscript = activeDeckKey === "day1" && currentPage === 12;
  const status = isHappy ? "● Căn cứ rõ" : answer.type === "low" ? "● Chưa đủ rõ" : "● Không có căn cứ";
  const actions = answer.actions
    ? `<div class="next-actions">${answer.actions.map((action) => `<button type="button">${action}</button>`).join("")}</div>`
    : "";
  const node = document.createElement("section");
  node.className = `message tutor-answer ${answer.type === "low" ? "risk" : answer.type === "failure" ? "failure" : ""}`;
  node.innerHTML = `
    <div class="answer-meta">
      <span>✦ FOCUS TUTOR · ${deck.label.toUpperCase()}</span>
      <span class="confidence">${status}</span>
    </div>
    <h3>${formatMarkdownHTML(answer.title)}</h3>
    <div class="tutor-body">${formatMarkdownHTML(answer.body)}</div>
    <div class="analogy">${formatMarkdownHTML(answer.analogy)}</div>
    ${isHappy ? `<button class="citation-button" type="button">
      <span>↗ Kiểm tra ${hasTranscript ? "2 căn cứ" : "căn cứ"}</span><span>Trang ${currentPage}${hasTranscript ? " · T04-047" : ""}</span>
    </button>` : ""}
    ${actions}
    ${isHappy ? `<div class="feedback">
      <span>Giải thích này có đúng chỗ bạn hỏi?</span>
      <button type="button" aria-label="Hữu ích">👍</button>
      <button type="button" aria-label="Chưa hữu ích">👎</button>
    </div>` : ""}
    <div class="correction">
      <button type="button">Không đúng ý mình → chọn lại đoạn</button>
    </div>
  `;
  node.querySelector(".citation-button")?.addEventListener("click", () => citationDialog.showModal());
  node.querySelectorAll(".next-actions button").forEach((button) => {
    button.addEventListener("click", () => submitQuestion(button.textContent));
  });
  node.querySelector(".correction button").addEventListener("click", () => {
    setContext(false);
    selection.focus();
  });
  messages.appendChild(node);
}

function saveToHistory(questionText) {
  try {
    const raw = localStorage.getItem("vlearn_chat_history");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      id: Date.now(),
      deck: activeDeckKey,
      page: currentPage,
      question: questionText,
      excerpt: compactText(selectedExcerpt, 80),
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem("vlearn_chat_history", JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn("Could not save chat history:", e);
  }
}

async function submitQuestion(text) {
  if (!hasContext || !text.trim()) return;
  welcome?.remove();
  addUserMessage(text.trim());
  saveToHistory(text.trim());
  question.value = "";
  const typing = addTyping();
  scrollMessages();
  
  const realLLMAnswer = await callRealLLMAPI(text.trim());
  
  window.setTimeout(() => {
    typing.remove();
    addTutorAnswer(text, realLLMAnswer);
    scrollMessages();
  }, 650);
}

selection.addEventListener("click", () => {
  selection.setAttribute("aria-pressed", "true");
  askSelection.hidden = false;
});
askSelection.addEventListener("click", () => setContext(true));
deckSwitcher.addEventListener("click", (event) => {
  const button = event.target.closest("[data-deck]");
  if (button && button.dataset.deck !== activeDeckKey) loadDeck(button.dataset.deck, 1);
});
previousPage.addEventListener("click", () => renderPage(currentPage - 1));
nextPage.addEventListener("click", () => renderPage(currentPage + 1));

// Đổi kích thước cửa sổ -> vẽ lại, nếu không lớp chữ sẽ lệch khỏi hình
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderPage(currentPage), 180);
});
clearContext.addEventListener("click", () => setContext(false));
suggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-question]");
  if (button) submitQuestion(button.dataset.question);
});
composer.addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuestion(question.value);
});
question.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitQuestion(question.value);
  }
});

function updateEngineBadge() {
  const badgeText = document.querySelector("#engineBadgeText");
  const apiKey = localStorage.getItem("vlearn_api_key");
  if (badgeText) {
    if (apiKey) {
      badgeText.textContent = `Gemini${activeModel ? ` · ${activeModel}` : ""} · Live API`;
      // Màu lấy từ hệ xanh lá trong styles.css thay vì hard-code
      badgeText.parentElement.style.background = "var(--g-100)";
      badgeText.parentElement.style.color = "var(--g-700)";
      badgeText.parentElement.style.borderColor = "var(--g-300)";
    } else {
      badgeText.textContent = "Smart Offline Engine";
      badgeText.parentElement.style.background = "";
      badgeText.parentElement.style.color = "";
      badgeText.parentElement.style.borderColor = "";
    }
  }
}

updateEngineBadge();

const apiKeyBtn = document.querySelector("#apiKeyButton");
if (apiKeyBtn) {
  apiKeyBtn.addEventListener("click", () => {
    const currentKey = localStorage.getItem("vlearn_api_key") || "";
    const inputKey = prompt("Nhập Gemini API Key để thực hiện lời gọi AI thật (CP3):", currentKey);
    if (inputKey !== null) {
      localStorage.setItem("vlearn_api_key", inputKey.trim());
      updateEngineBadge();
      alert(inputKey.trim() ? "🟢 Đã lưu API Key! Hệ thống sẽ thực hiện lời gọi AI thật khi bạn hỏi." : "⚡ Đã xóa API Key, hệ thống quay lại chế độ Offline Engine.");
    }
  });
}

const evalBtn = document.querySelector("#evalReportButton");
const evalModal = document.querySelector("#evalDialog");
const closeEvalModalBtn = document.querySelector("#closeEvalDialog");
const closeEvalBtn = document.querySelector("#closeEvalBtn");
const evalTableBody = document.querySelector("#evalTableBody");

if (evalBtn && evalModal) {
  evalBtn.addEventListener("click", async () => {
    try {
      const cases = await (await fetch("../eval/golden_set.json")).json();

      // Trạng thái PASS/FAIL đọc từ log thô của lượt đo THẬT (eval/run1_raw.json).
      // Chưa chạy eval thì hiện "CHƯA ĐO" — không bịa kết quả trên UI.
      let byId = {};
      try {
        const raw = await (await fetch("../eval/run1_raw.json")).json();
        raw.forEach((r) => { byId[r.case.id] = r; });
      } catch {
        byId = {};
      }
      const measured = Object.keys(byId).length;
      const passed = Object.values(byId).filter((r) => r.grade?.passed).length;
      const halluc = Object.values(byId).filter((r) => r.grade?.hallucination).length;

      const summary = document.querySelector("#evalSummaryBar");
      if (summary) {
        summary.innerHTML = measured
          ? `<div class="eval-metric"><span class="label">Đã đo</span><strong class="val">${measured}/${cases.length} case</strong></div>
             <div class="eval-metric"><span class="label">Tỷ lệ chính xác</span><strong class="val ${passed / measured >= 0.85 ? "pass" : "fail"}">${(passed / measured * 100).toFixed(1)}% (${passed}/${measured})</strong></div>
             <div class="eval-metric"><span class="label">Quality Bar</span><strong class="val">≥85.0% · ${passed / measured >= 0.85 ? "ĐẠT" : "CHƯA ĐẠT"}</strong></div>
             <div class="eval-metric"><span class="label">Tỷ lệ ảo giác</span><strong class="val ${halluc ? "fail" : "pass"}">${(halluc / measured * 100).toFixed(1)}%</strong></div>`
          : `<div class="eval-metric"><span class="label">Trạng thái</span><strong class="val">CHƯA CHẠY LƯỢT ĐO</strong></div>
             <div class="eval-metric"><span class="label">Golden set</span><strong class="val">${cases.length} case đã sẵn sàng</strong></div>
             <div class="eval-metric"><span class="label">Cách chạy</span><strong class="val">python eval/run_eval.py --run 1</strong></div>`;
      }

      if (evalTableBody) {
        evalTableBody.innerHTML = cases.map((c) => {
          const r = byId[c.id];
          const badge = !r
            ? `<span class="badge-pending">CHƯA ĐO</span>`
            : r.grade.passed
              ? `<span class="badge-pass">PASS</span>`
              : `<span class="badge-fail">FAIL</span>`;
          return `<tr>
            <td><b>${c.id}</b></td>
            <td>${c.difficulty_class}</td>
            <td>${c.input_question}</td>
            <td>Trang ${c.page || "—"}</td>
            <td>${badge}</td>
          </tr>`;
        }).join("");
      }
    } catch (e) {
      console.warn("Không đọc được golden set:", e);
    }
    evalModal.showModal();
  });

  closeEvalModalBtn?.addEventListener("click", () => evalModal.close());
  closeEvalBtn?.addEventListener("click", () => evalModal.close());
  evalModal.addEventListener("click", (e) => {
    if (e.target === evalModal) evalModal.close();
  });
}

closeDialog.addEventListener("click", () => citationDialog.close());
backToChat.addEventListener("click", () => citationDialog.close());
citationDialog.addEventListener("click", (event) => {
  if (event.target === citationDialog) citationDialog.close();
});

// FLOATING POPOVER TEXT SELECTION HANDLER
const popover = document.querySelector("#floatingSelectionToolbar");
const btnAskAI = document.querySelector("#btnAskAI");
const btnConfused = document.querySelector("#btnConfused");
const btnNote = document.querySelector("#btnNote");

let currentSelectedText = "";

document.addEventListener("mouseup", (e) => {
  if (popover && popover.contains(e.target)) return;

  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : "";

  // Chỉ nhận vùng bôi đen nằm trong slide (lớp chữ) hoặc khay nội dung bên dưới,
  // để bôi đen trong khung chat không bật nhầm toolbar.
  const anchor = sel && sel.anchorNode;
  const el = anchor && (anchor.nodeType === 1 ? anchor : anchor.parentElement);
  const insideSlide = !!el && !!el.closest?.(".textLayer, .selection-tray");

  if (text.length > 0 && insideSlide) {
    currentSelectedText = text;
    try {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (popover) {
        // popover dùng position:fixed -> toạ độ tính theo viewport, KHÔNG cộng scrollY
        popover.style.left = `${rect.left + rect.width / 2}px`;
        popover.style.top = `${rect.top}px`;
        popover.hidden = false;
      }
    } catch (err) {
      if (popover) popover.hidden = true;
    }
  } else {
    if (popover) popover.hidden = true;
  }
});

btnAskAI?.addEventListener("click", () => {
  if (!currentSelectedText) return;
  selectedExcerpt = currentSelectedText;
  setContext(true);
  if (popover) popover.hidden = true;
  question.value = `Giải thích cho tôi nghĩa của từ "${compactText(currentSelectedText, 40)}"`;
  question.focus();
});

btnConfused?.addEventListener("click", () => {
  if (!currentSelectedText) return;
  selectedExcerpt = currentSelectedText;
  setContext(true);
  if (popover) popover.hidden = true;
  submitQuestion(`Giải thích cho tôi nghĩa của từ "${currentSelectedText}"`);
});

btnNote?.addEventListener("click", () => {
  if (!currentSelectedText) return;
  alert(`📝 Đã lưu ghi chú cho đoạn: "${compactText(currentSelectedText, 50)}"`);
  if (popover) popover.hidden = true;
});

// CHAT HISTORY DIALOG HANDLER
const historyBtn = document.querySelector("#historyButton");
const historyModal = document.querySelector("#historyDialog");
const closeHistoryModalBtn = document.querySelector("#closeHistoryDialog");
const closeHistoryBtn = document.querySelector("#closeHistoryBtn");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
const historyListContainer = document.querySelector("#historyListContainer");

function renderHistoryModal() {
  try {
    const raw = localStorage.getItem("vlearn_chat_history");
    const list = raw ? JSON.parse(raw) : [];
    if (!list || list.length === 0) {
      historyListContainer.innerHTML = `<p style="text-align:center; color:var(--muted); padding:20px 0;">Chưa có lịch sử câu hỏi nào. Hãy thử đặt một câu hỏi trên slide!</p>`;
      return;
    }
    historyListContainer.innerHTML = list.map((item) => `
      <div class="history-item" data-page="${item.page}" data-deck="${item.deck}">
        <div class="history-meta">
          <span>${item.deck.toUpperCase()} · TRANG ${item.page}</span>
          <span>${item.time}</span>
        </div>
        <p class="history-q">💬 ${item.question}</p>
        <p class="history-excerpt">“${item.excerpt}”</p>
      </div>
    `).join("");

    historyListContainer.querySelectorAll(".history-item").forEach((el) => {
      el.addEventListener("click", () => {
        const page = Number(el.dataset.page);
        const deckKey = el.dataset.deck;
        if (deckKey !== activeDeckKey) {
          loadDeck(deckKey, page);
        } else {
          renderPage(page);
        }
        historyModal.close();
      });
    });
  } catch (e) {
    console.warn("Could not render history:", e);
  }
}

if (historyBtn && historyModal) {
  historyBtn.addEventListener("click", () => {
    renderHistoryModal();
    historyModal.showModal();
  });
  closeHistoryModalBtn?.addEventListener("click", () => historyModal.close());
  closeHistoryBtn?.addEventListener("click", () => historyModal.close());
  clearHistoryBtn?.addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử câu hỏi không?")) {
      localStorage.removeItem("vlearn_chat_history");
      renderHistoryModal();
    }
  });
  historyModal.addEventListener("click", (e) => {
    if (e.target === historyModal) historyModal.close();
  });
}

loadDeck("day1", 12).catch((error) => {
  slideLoading.hidden = false;
  slideLoading.textContent = `Không tải được slide: ${error.message}`;
  console.error(error);
});
