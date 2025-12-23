/* ============================================================================
   FIN-GUARD HOLDINGS MODULE
   - Portfolio-scoped holdings list
   - Create / delete holdings
   - Enforces: delete transactions before deleting holding
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  api_getHoldings,
  api_createHolding,
  api_deleteHolding,
  api_getTransactions,
} from "../core/api.js";

import {
  STORE_HOLDINGS_PAGE,
  getActivePortfolioId,
  getActivePortfolioName,
  setActiveHolding,
  getSocket,
} from "../core/state.js";

import {
  showToast,
  escapeHtml,
  buildPagination,
  showConfirm,
} from "../core/helpers.js";

import { showView } from "../layout/navigation.js";

/* ===================== DOM REFERENCES ===================== */

const holdingsList = document.getElementById("holdings-list");
const holdingsPagination = document.getElementById("holdings-pagination");
const holdingsTitle = document.getElementById("holdings-title");

const addNewHoldingBtn = document.getElementById("addNewHoldingBtn");
const backToPortfoliosBtn = document.getElementById("backToPortfolios");

const holdingCreateForm = document.getElementById("addHoldingForm");
const holdingCreateCancelBtn =
  document.getElementById("createHoldingCancel");

/* ===================== INIT ===================== */

function initHoldings() {
  /* ---- Navigation ---- */

  addNewHoldingBtn?.addEventListener("click", () => {
    const portfolioId = getActivePortfolioId();
    if (!portfolioId) {
      showToast("Please select a portfolio first", "warning");
      showView("view-portfolios");
      return;
    }
    showView("view-holding-create");
  });

  holdingCreateCancelBtn?.addEventListener("click", () => {
    showView("view-holdings");
  });

  backToPortfoliosBtn?.addEventListener("click", () => {
    showView("view-portfolios");
  });

  /* ---- Create ---- */

  holdingCreateForm?.addEventListener("submit", handleCreateHolding);

  /* ---- Load on view change ---- */

  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId !== "view-holdings") return;

    const portfolioId = getActivePortfolioId();
    if (!portfolioId) {
      showToast("No portfolio selected", "warning");
      showView("view-portfolios");
      return;
    }

    const page =
      Number(sessionStorage.getItem(STORE_HOLDINGS_PAGE)) || 1;

    loadHoldings(portfolioId, page);
  });
}

/* ===================== LOAD HOLDINGS ===================== */

async function loadHoldings(portfolioId, page = 1) {
  if (!holdingsList || !portfolioId) return;

  try {
    sessionStorage.setItem(STORE_HOLDINGS_PAGE, page);

    const res = await api_getHoldings(portfolioId, page);
    const holdings = res?.holdings || [];
    const totalPages = res?.pagination?.totalPages || 1;

    /* ---- Title ---- */

    const portfolioName = getActivePortfolioName();
    holdingsTitle.textContent = portfolioName
      ? `Holdings – ${portfolioName}`
      : "Holdings";

    holdingsList.innerHTML = "";

    if (holdings.length === 0) {
      holdingsList.innerHTML = `
        <div class="text-slate-500 text-center py-6">
          No holdings found in this portfolio.
        </div>
      `;
      holdingsPagination.innerHTML = "";
      return;
    }

    /* ---- Render cards ---- */

    holdings.forEach((h) => {
      const card = document.createElement("div");
      card.className =
        "border border-slate-200 rounded-lg p-4 hover:shadow-sm transition";

      card.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-slate-800">
              ${escapeHtml(h.symbol)}
            </h3>
            <p class="text-sm text-slate-500">
              Qty: ${h.quantity} | Avg: ₹${Number(h.avg_price).toFixed(2)}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              class="view-transactions-btn text-blue-600 text-sm underline"
              data-id="${h.id}"
              data-symbol="${h.symbol}"
            >
              Transactions
            </button>

            <button
              class="delete-holding-btn text-rose-600 text-sm underline"
              data-id="${h.id}"
            >
              Delete
            </button>
          </div>
        </div>
      `;

      holdingsList.appendChild(card);
    });

    attachHoldingActions(portfolioId);

    buildPagination(
      holdingsPagination,
      page,
      totalPages,
      (p) => loadHoldings(portfolioId, p)
    );
  } catch (err) {
    console.error("[HOLDINGS] Load failed:", err);
    showToast("Failed to load holdings", "error");
  }
}

/* ===================== CREATE HOLDING ===================== */

async function handleCreateHolding(e) {
  e.preventDefault();

  const portfolioId = getActivePortfolioId();
  if (!portfolioId) {
    showToast("No portfolio selected", "error");
    showView("view-portfolios");
    return;
  }

  try {
    const symbol =
      document.getElementById("holdingSymbol")?.value.trim();
    const quantity = Number(
      document.getElementById("holdingQty")?.value
    );
    const avg_price = Number(
      document.getElementById("holdingAvgPrice")?.value
    );

    if (!symbol || quantity <= 0 || avg_price <= 0) {
      showToast("Invalid holding details", "error");
      return;
    }

    const holding = await api_createHolding({
      portfolio_id: portfolioId,
      symbol,
      quantity,
      avg_price,
    });

    getSocket()?.emit("holding_added", holding);

    showToast("Holding added successfully", "success");

    holdingCreateForm.reset();
    showView("view-holdings");
  } catch (err) {
    console.error("[HOLDINGS] Create failed:", err);
    showToast("Failed to add holding", "error");
  }
}

/* ===================== ACTIONS ===================== */

function attachHoldingActions(portfolioId) {
  /* ---- Delete Holding ---- */

  document.querySelectorAll(".delete-holding-btn").forEach((btn) => {
    btn.onclick = async () => {
      const holdingId = btn.dataset.id;
      if (!holdingId) return;

      /* 🔍 Step 1: Check transactions */
      try {
        const txRes = await api_getTransactions(holdingId, 1);
        const txCount = txRes?.transactions?.length || 0;

        if (txCount > 0) {
          showToast(
            "Please delete all transactions before deleting this holding",
            "warning"
          );
          return;
        }
      } catch (err) {
        console.error("[HOLDINGS] Transaction check failed:", err);
        showToast("Unable to verify transactions", "error");
        return;
      }

      /* ✅ Step 2: Confirm delete */
      const confirmed = await showConfirm(
        "Are you sure you want to delete this holding?"
      );
      if (!confirmed) return;

      /* 🗑 Step 3: Delete holding */
      try {
        await api_deleteHolding(holdingId);
        getSocket()?.emit("holding_deleted", {
          holdingId,
          portfolioId,
        });

        showToast("Holding deleted", "success");

        const page =
          Number(sessionStorage.getItem(STORE_HOLDINGS_PAGE)) || 1;
        loadHoldings(portfolioId, page);
      } catch (err) {
        console.error("[HOLDINGS] Delete failed:", err);
        showToast("Failed to delete holding", "error");
      }
    };
  });

  /* ---- View Transactions ---- */

  document.querySelectorAll(".view-transactions-btn").forEach((btn) => {
    btn.onclick = () => {
      setActiveHolding(btn.dataset.id, btn.dataset.symbol);
      showView("view-holding-transactions");
    };
  });
}

/* ===================== EXPORTS ===================== */

export { initHoldings, loadHoldings };
