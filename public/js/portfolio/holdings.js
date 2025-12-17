/* ============================================================================
   FIN-GUARD HOLDINGS (FRONTEND)
   Portfolio holdings listing, creation, deletion, pagination
   REST-first + Socket relay (aligned with Portfolio & Expense pattern)

   Responsibilities:
   - Fetch holdings via REST APIs
   - Create / delete holdings via REST
   - Emit socket events AFTER successful REST actions
   - Render holdings UI and pagination
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  api_getHoldings,
  api_createHolding,
  api_deleteHolding,
} from "../core/api.js";

import { STORE_HOLDINGS_PAGE, getSocket } from "../core/state.js";

import {
  showToast,
  escapeHtml,
  buildPagination,
} from "../core/helpers.js";

import { showView } from "../layout/navigation.js";

/* ===================== DOM REFERENCES ===================== */

const holdingsList = document.getElementById("holdings-list");
const holdingsPagination = document.getElementById("holdings-pagination");

const addNewHoldingBtn = document.getElementById("addNewHoldingBtn");
const backToPortfoliosBtn = document.getElementById("backToPortfolios");

const holdingCreateForm = document.getElementById("addHoldingForm");
const holdingCreateCancelBtn = document.getElementById("createHoldingCancel");

const holdingsTitle = document.getElementById("holdings-title");

/* ============================================================================
   INIT
============================================================================ */

function initHoldings() {
  if (addNewHoldingBtn) {
    addNewHoldingBtn.addEventListener("click", () => {
      showView("view-holding-create");
    });
  }

  if (holdingCreateCancelBtn) {
    holdingCreateCancelBtn.addEventListener("click", () => {
      showView("view-holdings");
    });
  }

  if (backToPortfoliosBtn) {
    backToPortfoliosBtn.addEventListener("click", () => {
      showView("view-portfolios");
    });
  }

  if (holdingCreateForm) {
    holdingCreateForm.addEventListener("submit", handleCreateHolding);
  }

  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-holdings") {
      const portfolioId = sessionStorage.getItem("activePortfolioId");
      if (portfolioId) {
        loadHoldings(portfolioId);
      }
    }
  });
}

/* ============================================================================
   LOAD HOLDINGS
============================================================================ */

async function loadHoldings(portfolioId, page = 1) {
  try {
    if (!holdingsList || !portfolioId) return;

    sessionStorage.setItem(STORE_HOLDINGS_PAGE, page);

    const res = await api_getHoldings(portfolioId, page);
    const holdings = res?.holdings || [];
    const totalPages = res?.pagination?.totalPages || 1;

    holdingsList.innerHTML = "";

    if (!holdings.length) {
      holdingsList.innerHTML = `
        <div class="text-slate-500 text-center py-6">
          No holdings found in this portfolio.
        </div>
      `;
      return;
    }

    if (holdingsTitle) {
      holdingsTitle.textContent = "Holdings";
    }

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
              Qty: ${h.quantity} | Avg: ₹${h.avg_price}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              data-id="${h.id}"
              data-symbol="${h.symbol}"
              class="view-transactions-btn text-blue-600 text-sm underline"
            >
              Transactions
            </button>

            <button
              data-id="${h.id}"
              class="delete-holding-btn text-rose-600 text-sm underline"
            >
              Delete
            </button>
          </div>
        </div>
      `;

      holdingsList.appendChild(card);
    });

    attachHoldingActions(portfolioId);

    if (holdingsPagination) {
      buildPagination(
        holdingsPagination,
        page,
        totalPages,
        (p) => loadHoldings(portfolioId, p)
      );
    }
  } catch (err) {
    console.error("[HOLDINGS] Load failed:", err);
    showToast("Failed to load holdings", "error");
  }
}

/* ============================================================================
   CREATE HOLDING (REST → SOCKET EMIT)
============================================================================ */

async function handleCreateHolding(e) {
  e.preventDefault();

  try {
    const portfolioId = sessionStorage.getItem("activePortfolioId");
    if (!portfolioId) return;

    const symbol = document.getElementById("holdingSymbol")?.value.trim();
    const quantity = Number(document.getElementById("holdingQty")?.value);
    const avg_price = Number(
      document.getElementById("holdingAvgPrice")?.value
    );

    if (!symbol || quantity <= 0 || avg_price <= 0) {
      showToast("Invalid holding details", "error");
      return;
    }

    // REST call
    const holding = await api_createHolding({
      portfolio_id: portfolioId,
      symbol,
      quantity,
      avg_price,
    });

    // Socket emit (Expense-style pattern)
    const socket = getSocket();
    if (socket) {
      socket.emit("holding_added", holding);
    }

    showToast("Holding added successfully", "success");

    holdingCreateForm.reset();
    showView("view-holdings");
    loadHoldings(portfolioId, 1);
  } catch (err) {
    console.error("[HOLDINGS] Create failed:", err);
    showToast("Failed to add holding", "error");
  }
}

/* ============================================================================
   DELETE / VIEW ACTIONS (REST → SOCKET EMIT)
============================================================================ */

function attachHoldingActions(portfolioId) {
  document.querySelectorAll(".delete-holding-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!id) return;

      if (!confirm("Are you sure you want to delete this holding?")) return;

      try {
        await api_deleteHolding(id);

        // Socket emit
        const socket = getSocket();
        if (socket) {
          socket.emit("holding_deleted", { id, portfolioId });
        }

        showToast("Holding deleted", "success");

        const page =
          Number(sessionStorage.getItem(STORE_HOLDINGS_PAGE)) || 1;
        loadHoldings(portfolioId, page);
      } catch (err) {
        console.error("[HOLDINGS] Delete failed:", err);
        showToast("Failed to delete holding", "error");
      }
    });
  });

  document.querySelectorAll(".view-transactions-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      sessionStorage.setItem("activeHoldingId", btn.dataset.id);
      sessionStorage.setItem("activeHoldingSymbol", btn.dataset.symbol);
      showView("view-holding-transactions");
    });
  });
}

/* ============================================================================
   EXPORTS
============================================================================ */

export { initHoldings, loadHoldings };
