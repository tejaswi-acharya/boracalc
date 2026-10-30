const input = document.getElementById("inputBox");
const expressionLine = document.getElementById("expression");
const statusText = document.getElementById("statusText");
const keypad = document.getElementById("keypad");

let expression = "";
let justCalculated = false;
let history = [];

const messages = [
  "You never walk alone. Keep going, one step at a time.",
  " 작은 steps still take you somewhere. Keep believing in yourself.",
  "You are doing better than you think. Borahae! 💜",
  "Take a breath, trust yourself, and keep going.",
  "Seven stars. One universe. Endless reasons to smile."
];

function updateDisplay() {
  input.value = expression || "0";
  expressionLine.textContent = justCalculated ? "YOUR ANSWER ✦" : (expression ? "LET'S FIGURE IT OUT" : "");
}

function appendValue(value) {
  if (justCalculated && /[0-9.]/.test(value)) expression = "";
  justCalculated = false;

  const last = expression.slice(-1);
  const operators = ["+", "−", "×", "÷"];

  if (operators.includes(value)) {
    if (!expression && value !== "−") return;
    if (operators.includes(last)) expression = expression.slice(0, -1);
    expression += value;
  } else if (value === ".") {
    const currentNumber = expression.split(/[+−×÷%]/).pop();
    if (currentNumber.includes(".")) return;
    expression += currentNumber ? "." : "0.";
  } else if (value === "%") {
    if (!expression || operators.includes(last) || last === "%") return;
    expression += "%";
  } else {
    expression += value;
  }
  statusText.textContent = "READY WHEN YOU ARE";
  updateDisplay();
}

function clearAll() {
  expression = "";
  justCalculated = false;
  expressionLine.textContent = "";
  statusText.textContent = "CLEARED ✦";
  updateDisplay();
}

function deleteLast() {
  expression = expression.slice(0, -1);
  justCalculated = false;
  updateDisplay();
}

// Safe arithmetic parser: supports +, −, ×, ÷, %, decimals and parentheses.
// It deliberately avoids eval() so the display cannot execute arbitrary code.
function tokenize(source) {
  const normalized = source.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\s/g, "");
  const tokens = [];
  let i = 0;
  while (i < normalized.length) {
    const ch = normalized[i];
    if (/[0-9.]/.test(ch)) {
      let number = "";
      let dots = 0;
      while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
        if (normalized[i] === ".") dots++;
        number += normalized[i++];
      }
      if (dots > 1 || number === ".") throw new Error("Invalid number");
      tokens.push(Number(number));
    } else if ("+-*/()%".includes(ch)) {
      tokens.push(ch);
      i++;
    } else {
      throw new Error("Invalid character");
    }
  }
  return tokens;
}

function calculate(source) {
  const tokens = tokenize(source);
  let position = 0;

  function primary() {
    const token = tokens[position++];
    if (token === "+" || token === "-") {
      const value = primary();
      return token === "-" ? -value : value;
    }
    if (token === "(") {
      const value = addSub();
      if (tokens[position++] !== ")") throw new Error("Missing bracket");
      return value;
    }
    if (typeof token === "number") return token;
    throw new Error("Incomplete expression");
  }

  function postfix() {
    let value = primary();
    while (tokens[position] === "%") {
      position++;
      value = value / 100;
    }
    return value;
  }

  function multiplyDivide() {
    let value = postfix();
    while (tokens[position] === "*" || tokens[position] === "/") {
      const op = tokens[position++];
      const right = postfix();
      if (op === "/" && right === 0) throw new Error("Cannot divide by zero");
      value = op === "*" ? value * right : value / right;
    }
    return value;
  }

  function addSub() {
    let value = multiplyDivide();
    while (tokens[position] === "+" || tokens[position] === "-") {
      const op = tokens[position++];
      const right = multiplyDivide();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  if (!tokens.length) throw new Error("Enter a calculation");
  const result = addSub();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid calculation");
  return Number.parseFloat(result.toPrecision(12));
}

function showError(message) {
  input.value = "Oops!";
  expressionLine.textContent = message;
  statusText.textContent = "CHECK THAT EXPRESSION";
}

function addHistory(original, result) {
  history.unshift({ original, result });
  history = history.slice(0, 12);
  renderHistory();
}

function solve() {
  if (!expression) return;
  const original = expression;
  try {
    const result = calculate(expression);
    expression = String(result);
    justCalculated = true;
    input.value = expression;
    expressionLine.textContent = original + " =";
    statusText.textContent = "YOU DID THAT ✦";
    addHistory(original, result);
  } catch (error) {
    showError(error.message || "Something went wrong");
  }
}

function toggleSign() {
  if (!expression) return;
  try {
    expression = String(-calculate(expression));
    justCalculated = true;
    updateDisplay();
  } catch {
    if (expression.startsWith("−")) expression = expression.slice(1);
    else expression = "−" + expression;
    updateDisplay();
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { value, action } = button.dataset;
  if (action === "clear") clearAll();
  else if (action === "delete") deleteLast();
  else if (action === "equals") solve();
  else if (action === "sign") toggleSign();
  else if (value) appendValue(value);
});

document.addEventListener("keydown", (event) => {
  if (/^[0-9.]$/.test(event.key)) appendValue(event.key);
  else if (event.key === "+") appendValue("+");
  else if (event.key === "-") appendValue("−");
  else if (event.key === "*") appendValue("×");
  else if (event.key === "/") { event.preventDefault(); appendValue("÷"); }
  else if (event.key === "%") appendValue("%");
  else if (event.key === "Enter" || event.key === "=") { event.preventDefault(); solve(); }
  else if (event.key === "Backspace") deleteLast();
  else if (event.key === "Escape") clearAll();
});

const historyPanel = document.getElementById("historyPanel");
const panelBackdrop = document.getElementById("panelBackdrop");
const historyList = document.getElementById("historyList");

function openHistory() {
  historyPanel.classList.add("open");
  panelBackdrop.classList.add("show");
  historyPanel.setAttribute("aria-hidden", "false");
}
function closeHistory() {
  historyPanel.classList.remove("open");
  panelBackdrop.classList.remove("show");
  historyPanel.setAttribute("aria-hidden", "true");
}
function renderHistory() {
  historyList.innerHTML = "";
  if (!history.length) {
    historyList.innerHTML = '<p class="empty-history">Your calculations will appear here.</p>';
    return;
  }
  history.forEach(item => {
    const card = document.createElement("div");
    card.className = "history-item";
    const original = document.createElement("span");
    const result = document.createElement("strong");
    original.textContent = item.original;
    result.textContent = "= " + item.result;
    card.append(original, result);
    historyList.appendChild(card);
  });
}

document.getElementById("historyToggle").addEventListener("click", openHistory);
document.getElementById("closeHistory").addEventListener("click", closeHistory);
panelBackdrop.addEventListener("click", closeHistory);
document.getElementById("clearHistory").addEventListener("click", () => {
  history = [];
  renderHistory();
});

const armyModal = document.getElementById("armyModal");
function openArmyModal() { armyModal.classList.add("show"); }
function closeArmyModal() { armyModal.classList.remove("show"); }
const armyMusic = document.getElementById("armyMusic");
const musicFile = document.getElementById("musicFile");
const musicStatus = document.getElementById("musicStatus");
let musicObjectUrl = "";

musicFile.addEventListener("change", () => {
  const [file] = musicFile.files;
  if (!file) return;
  if (musicObjectUrl) URL.revokeObjectURL(musicObjectUrl);
  musicObjectUrl = URL.createObjectURL(file);
  armyMusic.src = musicObjectUrl;
  musicStatus.textContent = file.name;
  armyMusic.play().catch(() => {
    musicStatus.textContent = `${file.name} is ready to play`;
  });
});

document.getElementById("armyButton").addEventListener("click", openArmyModal);
document.getElementById("footerArmy").addEventListener("click", openArmyModal);
document.getElementById("closeModal").addEventListener("click", closeArmyModal);
armyModal.addEventListener("click", event => {
  if (event.target === armyModal) closeArmyModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeArmyModal();
    closeHistory();
  }
});

document.getElementById("newQuote").addEventListener("click", () => {
  const quote = document.getElementById("armyQuote");
  const current = quote.textContent;
  let next = current;
  while (next === current) next = messages[Math.floor(Math.random() * messages.length)];
  quote.textContent = next;
});

updateDisplay();
renderHistory();
