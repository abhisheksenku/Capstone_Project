/* ============================================================================
   FIN-GUARD TRANSACTIONS MODULE
   - Holding-scoped transaction list
   - Add / Delete transactions
   - Refresh-safe
   - REST first, socket after
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  api_getTransactions,
  api_addTransaction,
  api_deleteTransaction,
} from "../core/api.js";

import { getSocket } from "../core/state.js";

import {
  showToast,
  buildPagination,
  showConfirm,
} from "../core/helpers.js";

import { showView } from "../layout/navigation.js";

/* ===================== DOM REFERENCES ===================== */

const transactionsList = document.getElementById("transactions-list");
const transactionsPagination = document.getElementById(
  "transactions-pagination"
);

const openAddTransactionBtn = document.getElementById("openAddTransactionBtn");
const cancelTransactionBtn = document.getElementById("cancelTransactionBtn");
const backToHoldingsBtn = document.getElementById("backToHoldings");

const transactionsTableContainer = document.getElementById(
  "transactions-table-container"
);
const transactionFormContainer = document.getElementById(
  "transaction-form-container"
);

const addTransactionForm = document.getElementById("addTransactionForm");

/* ===================== INIT ===================== */

function initTransactions() {
  /* ---- UI buttons ---- */

  openAddTransactionBtn?.addEventListener("click", () =>
    toggleTransactionForm(true)
  );

  cancelTransactionBtn?.addEventListener("click", () =>
    toggleTransactionForm(false)
  );

  backToHoldingsBtn?.addEventListener("click", () => {
    showView("view-holdings");
  });

  addTransactionForm?.addEventListener("submit", handleAddTransaction);

  /* ---- Load on view activation ---- */

  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-holding-transactions") {
      const holdingId = sessionStorage.getItem("fg_active_holding_id");

      if (!holdingId) {
        showToast("No holding selected", "warning");
        showView("view-holdings");
        return;
      }

      loadTransactions(Number(holdingId), 1);
    }
  });
}

/* ===================== LOAD TRANSACTIONS ===================== */

async function loadTransactions(holdingId, page = 1) {
  if (!transactionsList || !holdingId) return;

  try {
    const res = await api_getTransactions(holdingId, page);
    const transactions = res?.transactions || [];
    const totalPages = res?.pagination?.totalPages || 1;

    transactionsList.innerHTML = "";

    if (transactions.length === 0) {
      transactionsList.innerHTML = `
        <div class="text-slate-500 text-center py-6">
          No transactions found for this holding.
        </div>
      `;
      transactionsPagination.innerHTML = "";
      toggleTransactionForm(false);
      return;
    }

    transactions.forEach((t) => {
      const row = document.createElement("div");
      row.className =
        "border border-slate-200 rounded-lg p-3 flex justify-between items-center";

      row.innerHTML = `
        <div>
          <div class="font-semibold text-slate-800">
            ${t.txn_type}
          </div>
          <div class="text-sm text-slate-500">
            Qty: ${t.qty} @ ₹${Number(t.price).toFixed(2)}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            ${new Date(t.createdAt).toLocaleDateString("en-IN")}
          </div>
        </div>

        <button
          class="text-rose-600 text-xs hover:underline"
          data-id="${t.id}"
        >
          Delete
        </button>
      `;

      /* ---- Delete handler ---- */
      row
        .querySelector("button[data-id]")
        ?.addEventListener("click", async () => {
          await handleDeleteTransaction(t.id, holdingId, page);
        });

      transactionsList.appendChild(row);
    });

    buildPagination(
      transactionsPagination,
      page,
      totalPages,
      (p) => loadTransactions(holdingId, p)
    );

    toggleTransactionForm(false);
  } catch (err) {
    console.error("[TRANSACTIONS] Load failed:", err);
    showToast("Failed to load transactions", "error");
  }
}

/* ===================== ADD TRANSACTION ===================== */

async function handleAddTransaction(e) {
  e.preventDefault();

  try {
    const holdingId = sessionStorage.getItem("fg_active_holding_id");
    const symbol = sessionStorage.getItem("fg_active_holding_symbol");

    if (!holdingId || !symbol) {
      showToast("No holding selected", "error");
      showView("view-holdings");
      return;
    }

    const txn_type = document.getElementById("txnType")?.value;
    const qty = Number(document.getElementById("txnQty")?.value);
    const price = Number(document.getElementById("txnPrice")?.value);

    if (!txn_type || qty <= 0 || price <= 0) {
      showToast("Invalid transaction details", "error");
      return;
    }

    const payload = {
      holdingId: Number(holdingId),
      symbol,
      txn_type,
      qty,
      price,
    };

    const transaction = await api_addTransaction(payload);

    const socket = getSocket();
    socket?.emit("transaction_created", transaction);

    if (socket && transaction?.fraudScore > 0.1) {
      socket.emit("fraud_check_result", {
        transactionId:
          transaction.transaction?.id ?? transaction.id,
        score: transaction.fraudScore,
        reasons: transaction.reasons || [],
      });
    }

    showToast("Transaction added successfully", "success");

    addTransactionForm.reset();
    loadTransactions(Number(holdingId), 1);
  } catch (err) {
    console.error("[TRANSACTIONS] Add failed:", err);
    showToast("Failed to add transaction", "error");
  }
}

/* ===================== DELETE TRANSACTION ===================== */

async function handleDeleteTransaction(transactionId, holdingId, page) {
  const confirmed = await showConfirm(
    "Delete this transaction? Holding values will be recalculated."
  );

  if (!confirmed) return;

  try {
    await api_deleteTransaction(transactionId);
    showToast("Transaction deleted", "success");
    loadTransactions(holdingId, page);
  } catch (err) {
    console.error("[TRANSACTIONS] Delete failed:", err);
    showToast("Failed to delete transaction", "error");
  }
}

/* ===================== UI HELPERS ===================== */

function toggleTransactionForm(show) {
  if (!transactionsTableContainer || !transactionFormContainer) return;

  transactionsTableContainer.classList.toggle("hidden", show);
  transactionFormContainer.classList.toggle("hidden", !show);
}

/* ===================== EXPORTS ===================== */

export { initTransactions, loadTransactions };
