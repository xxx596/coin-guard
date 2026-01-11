// ===== Utilities =====
const money = (n) => {
  const val = Number(n || 0);
  return val.toLocaleString(undefined, { style: "currency", currency: "USD" });
};

const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

const todayISO = () => {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};

// ===== Storage =====
const STORAGE_KEY = "coin_guard_transactions_v1";

function loadTx() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

function saveTx(txs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
}

// ===== Initial Data =====
let transactions = loadTx() || [
  { id: crypto.randomUUID(), type: "income", title: "Freelance", category: "Freelance", amount: 310, date: "2025-01-08" },
  { id: crypto.randomUUID(), type: "expense", title: "Transport", category: "Transport", amount: 6, date: "2025-01-09" },
  { id: crypto.randomUUID(), type: "expense", title: "Groceries", category: "Food", amount: 45, date: "2025-01-10" },
  { id: crypto.randomUUID(), type: "income", title: "Salary", category: "Salary", amount: 1200, date: "2025-01-11" },
];

// ===== Elements =====
const elTotalBalance = document.getElementById("totalBalance");
const elIncomeM = document.getElementById("incomeM");
const elExpenseM = document.getElementById("expenseM");
const elSavings = document.getElementById("savings");
const elRemaining = document.getElementById("remaining");

const elTxList = document.getElementById("txList");
const elAllWrap = document.getElementById("allWrap");
const elAllList = document.getElementById("allList");

const btnAddIncome = document.getElementById("btnAddIncome");
const btnAddExpense = document.getElementById("btnAddExpense");
const btnToggleAll = document.getElementById("toggleAll");
const btnClearAll = document.getElementById("btnClearAll");

const filterType = document.getElementById("filterType");
const searchText = document.getElementById("searchText");

// Modal elements
const overlay = document.getElementById("overlay");
const modal = document.getElementById("txModal");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModal");
const cancelModalBtn = document.getElementById("cancelModal");
const txForm = document.getElementById("txForm");

const txType = document.getElementById("txType");
const txTitle = document.getElementById("txTitle");
const txAmount = document.getElementById("txAmount");
const txCategory = document.getElementById("txCategory");
const txDate = document.getElementById("txDate");

// ===== Render =====
function computeSummary() {
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  // Month summary (current month)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthIncome = transactions
    .filter(t => t.type === "income" && monthKey(t.date) === currentMonth)
    .reduce((s, t) => s + Number(t.amount), 0);

  const monthExpense = transactions
    .filter(t => t.type === "expense" && monthKey(t.date) === currentMonth)
    .reduce((s, t) => s + Number(t.amount), 0);

  return { balance, totalIncome, totalExpense, monthIncome, monthExpense };
}

function renderSummary() {
  const s = computeSummary();
  elTotalBalance.textContent = money(s.balance);
  elIncomeM.textContent = money(s.monthIncome);
  elExpenseM.textContent = money(s.monthExpense);

  // Simple “savings” logic (you can change it later)
  elSavings.textContent = money(s.balance);
  elRemaining.textContent = money(s.balance);
}

function txRow(t, { showDelete = true } = {}) {
  const sign = t.type === "income" ? "+" : "-";
  const amtClass = t.type;

  const wrap = document.createElement("div");
  wrap.className = "tx";

  const left = document.createElement("div");
  left.className = "tx-left";

  const title = document.createElement("div");
  title.className = "tx-title";
  title.textContent = t.title;

  const meta = document.createElement("div");
  meta.className = "tx-meta";
  meta.textContent = `${t.category} • ${new Date(t.date).toLocaleDateString()}`;

  left.appendChild(title);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.className = "tx-actions";

  const amt = document.createElement("div");
  amt.className = `tx-amt ${amtClass}`;
  amt.textContent = `${sign} ${money(t.amount)}`;

  right.appendChild(amt);

  if (showDelete) {
    const del = document.createElement("button");
    del.className = "icon-btn-sm";
    del.title = "Delete";
    del.textContent = "🗑";
    del.addEventListener("click", () => {
      transactions = transactions.filter(x => x.id !== t.id);
      saveTx(transactions);
      renderAll();
    });
    right.appendChild(del);
  }

  wrap.appendChild(left);
  wrap.appendChild(right);
  return wrap;
}

function renderRecent() {
  elTxList.innerHTML = "";

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 5);

  if (recent.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No transactions yet. Add income or expense.";
    elTxList.appendChild(empty);
    return;
  }

  recent.forEach(t => elTxList.appendChild(txRow(t)));
}

function renderAllList() {
  elAllList.innerHTML = "";

  let data = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const ft = filterType.value;
  if (ft !== "all") data = data.filter(t => t.type === ft);

  const q = searchText.value.trim().toLowerCase();
  if (q) data = data.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));

  if (data.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No matching transactions.";
    elAllList.appendChild(empty);
    return;
  }

  data.forEach(t => elAllList.appendChild(txRow(t)));
}

function renderAll() {
  renderSummary();
  renderRecent();
  if (!elAllWrap.classList.contains("hidden")) renderAllList();
}

// ===== Modal =====
function openModal(type) {
  txType.value = type;
  modalTitle.textContent = type === "income" ? "Add Income" : "Add Expense";

  txTitle.value = "";
  txAmount.value = "";
  txCategory.value = "";
  txDate.value = todayISO();

  overlay.classList.remove("hidden");
  modal.classList.remove("hidden");

  // focus
  setTimeout(() => txTitle.focus(), 0);
}

function closeModal() {
  overlay.classList.add("hidden");
  modal.classList.add("hidden");
}

overlay.addEventListener("click", closeModal);
closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});

txForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const type = txType.value;
  const title = txTitle.value.trim();
  const amount = Number(txAmount.value);
  const category = txCategory.value;
  const date = txDate.value;

  if (!title || !category || !date || !Number.isFinite(amount) || amount <= 0) return;

  transactions.push({
    id: crypto.randomUUID(),
    type,
    title,
    category,
    amount,
    date
  });

  saveTx(transactions);
  closeModal();
  renderAll();
});

// ===== Events =====
btnAddIncome.addEventListener("click", () => openModal("income"));
btnAddExpense.addEventListener("click", () => openModal("expense"));

btnToggleAll.addEventListener("click", () => {
  const isHidden = elAllWrap.classList.toggle("hidden");
  btnToggleAll.textContent = isHidden ? "See all transactions →" : "Hide transactions ←";
  if (!isHidden) renderAllList();
});

filterType.addEventListener("change", renderAllList);
searchText.addEventListener("input", renderAllList);

btnClearAll.addEventListener("click", () => {
  if (!confirm("Delete ALL transactions?")) return;
  transactions = [];
  saveTx(transactions);
  renderAll();
});

// ===== Init =====
renderAll();
