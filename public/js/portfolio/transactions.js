/* ============================================================================
   FIN-GUARD TRANSACTIONS (FRONTEND)
   Holding transactions listing, creation, pagination
   REST-first + Socket relay (aligned with Portfolio & Holdings pattern)

   Responsibilities:
   - Fetch transactions via REST APIs
   - Add transactions via REST
   - Emit socket events AFTER successful REST actions
   - Render transaction list and pagination
============================================================================ */

/* ===================== IMPORTS ===================== */

import { api_getTransactions, api_addTransaction } from "../core/api.js";

import { STORE_HOLDINGS_PAGE, getSocket } from "../core/state.js";

import { showToast, buildPagination } from "../core/helpers.js";

import { showView } from "../layout/navigation.js";

/* ===================== DOM REFERENCES ===================== */

const transactionsList = document.getElementById("transactions-list");
const transactionsPagination = document.getElementById(
  "transactions-pagination"
);

const openAddTransactionBtn = document.getElementById("openAddTransactionBtn");
const cancelTransactionBtn = document.getElementById("cancelTransactionBtn");

const transactionsTableContainer = document.getElementById(
  "transactions-table-container"
);
const transactionFormContainer = document.getElementById(
  "transaction-form-container"
);

const addTransactionForm = document.getElementById("addTransactionForm");
const backToHoldingsBtn = document.getElementById("backToHoldings");

/* ============================================================================
   INIT
============================================================================ */

function initTransactions() {
  if (openAddTransactionBtn) {
    openAddTransactionBtn.addEventListener("click", () =>
      toggleTransactionForm(true)
    );
  }

  if (cancelTransactionBtn) {
    cancelTransactionBtn.addEventListener("click", () =>
      toggleTransactionForm(false)
    );
  }

  if (backToHoldingsBtn) {
    backToHoldingsBtn.addEventListener("click", () =>
      showView("view-holdings")
    );
  }

  if (addTransactionForm) {
    addTransactionForm.addEventListener("submit", handleAddTransaction);
  }

  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-holding-transactions") {
      const holdingId = sessionStorage.getItem("activeHoldingId");
      if (holdingId) {
        loadTransactions(holdingId);
      }
    }
  });
}

/* ============================================================================
   LOAD TRANSACTIONS
============================================================================ */

async function loadTransactions(holdingId, page = 1) {
  try {
    if (!transactionsList || !holdingId) return;

    sessionStorage.setItem(STORE_HOLDINGS_PAGE, page);

    const res = await api_getTransactions(holdingId, page);
    const transactions = res?.transactions || [];
    const totalPages = res?.pagination?.totalPages || 1;

    transactionsList.innerHTML = "";

    if (!transactions.length) {
      transactionsList.innerHTML = `
        <div class="text-slate-500 text-center py-6">
          No transactions found.
        </div>
      `;
      toggleTransactionForm(false);
      return;
    }

    transactions.forEach((t) => {
      const row = document.createElement("div");
      row.className =
        "border border-slate-200 rounded-lg p-3 flex justify-between items-center";

      row.innerHTML = `
        <div>
          <div class="font-medium text-slate-800">${t.txn_type}</div>
          <div class="text-sm text-slate-500">
            Qty: ${t.qty} @ ₹${t.price}
          </div>
        </div>
        <div class="text-sm text-slate-600">
          ${new Date(t.createdAt).toLocaleDateString("en-IN")}
        </div>
      `;

      transactionsList.appendChild(row);
    });

    if (transactionsPagination) {
      buildPagination(transactionsPagination, page, totalPages, (p) =>
        loadTransactions(holdingId, p)
      );
    }

    toggleTransactionForm(false);
  } catch (err) {
    console.error("[TRANSACTIONS] Load failed:", err);
    showToast("Failed to load transactions", "error");
  }
}

/* ============================================================================
   ADD TRANSACTION (REST → SOCKET EMIT)
============================================================================ */

async function handleAddTransaction(e) {
  e.preventDefault();

  try {
    const holdingId = sessionStorage.getItem("activeHoldingId");
    const symbol = sessionStorage.getItem("activeHoldingSymbol");

    const txn_type = document.getElementById("txnType")?.value;
    const qty = Number(document.getElementById("txnQty")?.value);
    const price = Number(document.getElementById("txnPrice")?.value);

    if (!holdingId || !symbol || !txn_type || qty <= 0 || price <= 0) {
      showToast("Invalid transaction details", "error");
      return;
    }

    // REST call
    const transaction = await api_addTransaction({
      holdingId: Number(holdingId),
      symbol,
      qty,
      price,
      txn_type,
    });

    // Socket emit (Expense-style pattern)
    const socket = getSocket();
    if (socket) {
      socket.emit("transaction_created", transaction);
    }
    if (socket && transaction?.fraudScore > 0.1) {
      console.log("[FRONTEND] Emitting fraud_check_result", {
        transactionId: transaction.transaction?.id,
        score: transaction.fraudScore,
      });
      socket.emit("fraud_check_result", {
        transactionId: transaction.transaction?.id ?? transaction.id,
        score: transaction.fraudScore,
        reasons: transaction.reasons || [],
      });
    }

    showToast("Transaction added successfully", "success");

    addTransactionForm.reset();
    loadTransactions(holdingId, 1);
  } catch (err) {
    console.error("[TRANSACTIONS] Add failed:", err);
    showToast("Failed to add transaction", "error");
  }
}

/* ============================================================================
   UI HELPERS
============================================================================ */

function toggleTransactionForm(show) {
  if (!transactionsTableContainer || !transactionFormContainer) return;

  transactionsTableContainer.classList.toggle("hidden", show);
  transactionFormContainer.classList.toggle("hidden", !show);
}

/* ============================================================================
   EXPORTS
============================================================================ */

export { initTransactions, loadTransactions };
