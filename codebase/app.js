import * as pdfjsLib from "./vendor/pdfjs/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;

const selection = document.querySelector("#selection");
const askSelection = document.querySelector("#askSelection");
const slideCanvas = document.querySelector("#slideCanvas");
const slideLoading = document.querySelector("#slideLoading");
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

async function pageText(page) {
  if (activeDeckKey === "day1" && currentPage === 12) {
    return "Mỗi token mới được nối vào ngữ cảnh, rồi model chạy lại từ đầu — vòng lặp predict → append → rerun.";
  }
  const text = await page.getTextContent();
  return compactText(text.items.map((item) => item.str).join(" "));
}

async function renderPage(pageNumber) {
  if (!pdfDocument) return;
  currentPage = Math.max(1, Math.min(pageNumber, pdfDocument.numPages));
  slideLoading.hidden = false;
  setContext(false);

  const page = await pdfDocument.getPage(currentPage);
  const viewport = page.getViewport({ scale: 1.55 });
  const context = slideCanvas.getContext("2d");
  slideCanvas.width = viewport.width;
  slideCanvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;

  selectedExcerpt = await pageText(page);
  selection.textContent = selectedExcerpt || "Trang này chủ yếu là hình ảnh. Hãy nhập câu hỏi cụ thể cho tutor.";
  const deck = decks[activeDeckKey];
  viewerTitle.textContent = `${deck.label} · ${deck.title}`;
  courseEyebrow.textContent = `AI IN ACTION · ${deck.label.toUpperCase()}`;
  courseTitle.textContent = deck.title;
  currentPageLabel.textContent = `${currentPage} / ${pdfDocument.numPages}`;
  headerPageLabel.textContent = `${currentPage} / ${pdfDocument.numPages}`;
  progressFill.style.width = `${(currentPage / pdfDocument.numPages) * 100}%`;
  selectionLabel.textContent = `NỘI DUNG TRANG ${currentPage} · NHẤN ĐỂ CHỌN`;
  contextTitle.textContent = `Đang hỏi về · ${deck.label} · Trang ${currentPage}`;
  dialogSlideSource.textContent = `Slide · ${deck.label} · Trang ${currentPage}`;
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
    : "Chọn một đoạn trên slide để bắt đầu…";
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
  if (!(activeDeckKey === "day1" && currentPage === 12)) {
    return {
      type: "happy",
      title: `Ý chính của trang ${currentPage}`,
      body: `Tutor đang giải thích từ đúng nội dung đã chọn trong ${decks[activeDeckKey].label}: “${compactText(selectedExcerpt, 150)}”`,
      analogy: "Đây là phản hồi mock của CP2; phần sinh giải thích bằng AI và kiểm tra độ đúng thuộc CP3."
    };
  }
  if (normalized.includes("kiểm tra")) {
    return {
      type: "happy",
      title: "Thử kiểm tra bằng một câu ngắn",
      body: "Sau khi model chọn được một token mới, điều gì xảy ra trước khi nó dự đoán token kế tiếp?",
      analogy: "Gợi ý: hãy nhìn lại ba bước predict → append → rerun trên slide."
    };
  }
  if (normalized.includes("ví dụ")) {
    return {
      type: "happy",
      title: "Ví dụ với câu “Một tách…”",
      body: "Model chấm xác suất cho nhiều token có thể đứng tiếp theo. Nếu chọn “cà phê”, nó nối token này vào câu thành “Một tách cà phê”, rồi dùng toàn bộ câu mới làm ngữ cảnh cho lần dự đoán tiếp theo.",
      analogy: "Điểm cần nhớ: model không viết cả câu một lần; nó lặp lại việc chọn từng mảnh nhỏ."
    };
  }
  return {
    type: "happy",
    title: "Hiểu đơn giản trong 20 giây",
    body: "LLM viết từng token một. Mỗi lần chọn xong một token, nó gắn token đó vào phần đã có rồi đọc lại ngữ cảnh mới để đoán token kế tiếp. Chu trình này lặp đến khi câu trả lời hoàn tất.",
    analogy: "Giống như nối một đoàn tàu: thêm một toa, nhìn lại cả đoàn hiện tại, rồi mới quyết định toa tiếp theo."
  };
}

function addTutorAnswer(text) {
  const answer = answerFor(text);
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
      <span>FOCUS TUTOR · ${deck.label.toUpperCase()} · TRANG ${currentPage}</span>
      <span class="confidence">${status}</span>
    </div>
    <h3>${answer.title}</h3>
    <p>${answer.body}</p>
    <p class="analogy">${answer.analogy}</p>
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

function submitQuestion(text) {
  if (!hasContext || !text.trim()) return;
  welcome?.remove();
  addUserMessage(text.trim());
  question.value = "";
  const typing = addTyping();
  scrollMessages();
  window.setTimeout(() => {
    typing.remove();
    addTutorAnswer(text);
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
resetButton.addEventListener("click", () => window.location.reload());
closeDialog.addEventListener("click", () => citationDialog.close());
backToChat.addEventListener("click", () => citationDialog.close());
citationDialog.addEventListener("click", (event) => {
  if (event.target === citationDialog) citationDialog.close();
});

loadDeck("day1", 12).catch((error) => {
  slideLoading.hidden = false;
  slideLoading.textContent = `Không tải được slide: ${error.message}`;
  console.error(error);
});
