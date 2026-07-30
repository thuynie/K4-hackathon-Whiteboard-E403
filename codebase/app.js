const selection = document.querySelector("#selection");
const contextChip = document.querySelector("#contextChip");
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

const selectedExcerpt = "Mỗi token mới được nối vào ngữ cảnh, rồi model chạy lại từ đầu";
let hasContext = false;

function setContext(enabled) {
  hasContext = enabled;
  selection.setAttribute("aria-pressed", String(enabled));
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
  if (normalized.includes("kiểm tra")) {
    return {
      title: "Thử kiểm tra bằng một câu ngắn",
      body: "Sau khi model chọn được một token mới, điều gì xảy ra trước khi nó dự đoán token kế tiếp?",
      analogy: "Gợi ý: hãy nhìn lại ba bước predict → append → rerun trên slide."
    };
  }
  if (normalized.includes("ví dụ")) {
    return {
      title: "Ví dụ với câu “Một tách…”",
      body: "Model chấm xác suất cho nhiều token có thể đứng tiếp theo. Nếu chọn “cà phê”, nó nối token này vào câu thành “Một tách cà phê”, rồi dùng toàn bộ câu mới làm ngữ cảnh cho lần dự đoán tiếp theo.",
      analogy: "Điểm cần nhớ: model không viết cả câu một lần; nó lặp lại việc chọn từng mảnh nhỏ."
    };
  }
  return {
    title: "Hiểu đơn giản trong 20 giây",
    body: "LLM viết từng token một. Mỗi lần chọn xong một token, nó gắn token đó vào phần đã có rồi đọc lại ngữ cảnh mới để đoán token kế tiếp. Chu trình này lặp đến khi câu trả lời hoàn tất.",
    analogy: "Giống như nối một đoàn tàu: thêm một toa, nhìn lại cả đoàn hiện tại, rồi mới quyết định toa tiếp theo."
  };
}

function addTutorAnswer(text) {
  const answer = answerFor(text);
  const node = document.createElement("section");
  node.className = "message tutor-answer";
  node.innerHTML = `
    <div class="answer-meta">
      <span>FOCUS TUTOR · TRANG 12</span>
      <span class="confidence">● Căn cứ rõ</span>
    </div>
    <h3>${answer.title}</h3>
    <p>${answer.body}</p>
    <p class="analogy">${answer.analogy}</p>
    <button class="citation-button" type="button">
      <span>↗ Xem căn cứ trên slide</span><span>Trang 12</span>
    </button>
    <div class="feedback">
      <span>Giải thích này có đúng chỗ bạn hỏi?</span>
      <button type="button" aria-label="Hữu ích">👍</button>
      <button type="button" aria-label="Chưa hữu ích">👎</button>
    </div>
    <div class="correction">
      <button type="button">Không đúng ý mình → chọn lại đoạn</button>
    </div>
  `;
  node.querySelector(".citation-button").addEventListener("click", () => citationDialog.showModal());
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

selection.addEventListener("click", () => setContext(true));
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
