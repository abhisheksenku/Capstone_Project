/* ============================================================================
   FIN-GUARD PORTFOLIOS MODULE
   - Portfolio list, create, delete
   - Enforces: delete holdings before deleting portfolio
   - Refresh-safe & view-driven
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  api_getPortfolios,
  api_createPortfolio,
  api_deletePortfolio,
  api_getHoldings,
} from "../core/api.js";

import {
  setActivePortfolio,
  clearActivePortfolio,
  getSocket,
} from "../core/state.js";

import {
  escapeHtml,
  buildPagination,
  showToast,
  showConfirm,
} from "../core/helpers.js";

import { showView } from "../layout/navigation.js";

/* ===================== DOM REFERENCES ===================== */

const portfolioList = document.getElementById("portfolio-list");
const paginationContainer = document.getElementById("portfolio-pagination");

const addNewPortfolioBtn = document.getElementById("addNewPortfolioBtn");
const portfolioCreateForm = document.getElementById("portfolioCreateForm");
const createCancelBtn = document.getElementById("createPortfolioCancel");

/* ===================== INIT ===================== */

function initPortfolios() {
  /* ---- Navigation ---- */

  addNewPortfolioBtn?.addEventListener("click", () => {
    showView("view-portfolio-create");
  });

  createCancelBtn?.addEventListener("click", () => {
    showView("view-portfolios");
  });

  /* ---- Create ---- */

  portfolioCreateForm?.addEventListener("submit", handleCreatePortfolio);

  /* ---- Load when view activates ---- */

  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-portfolios") {
      loadPortfolios();
    }
  });
}

/* ===================== LOAD PORTFOLIOS ===================== */

async function loadPortfolios(page = 1) {
  if (!portfolioList) return;

  try {
    const res = await api_getPortfolios(page);
    const portfolios = res?.portfolios ?? [];
    const totalPages = res?.pagination?.totalPages ?? 1;

    portfolioList.innerHTML = "";
    paginationContainer.innerHTML = "";

    /* ---- Empty state ---- */

    if (portfolios.length === 0) {
      portfolioList.innerHTML = `
        <div class="text-slate-500 text-center py-6">
          No portfolios found. Create your first portfolio to get started.
        </div>
      `;

      const activeId =
        sessionStorage.getItem("fg_active_portfolio_id");
      if (activeId) {
        clearActivePortfolio();
      }
      return;
    }

    /* ---- Render cards ---- */

    portfolios.forEach((p) => {
      const card = document.createElement("div");
      card.className =
        "border border-slate-200 rounded-lg p-4 hover:shadow-sm transition";

      card.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-slate-800">
              ${escapeHtml(p.name)}
            </h3>
            <p class="text-sm text-slate-500">
              ${escapeHtml(p.description || "—")}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              class="view-holdings-btn text-blue-600 text-sm underline"
              data-id="${p.id}"
              data-name="${escapeHtml(p.name)}"
            >
              View
            </button>

            <button
              class="delete-portfolio-btn text-rose-600 text-sm underline"
              data-id="${p.id}"
            >
              Delete
            </button>
          </div>
        </div>
      `;

      portfolioList.appendChild(card);
    });

    attachPortfolioActions();

    /* ---- Pagination ---- */

    if (paginationContainer && totalPages > 1) {
      buildPagination(
        paginationContainer,
        page,
        totalPages,
        loadPortfolios
      );
    }
  } catch (err) {
    console.error("[PORTFOLIOS] Load failed:", err);
    showToast("Failed to load portfolios", "error");
  }
}

/* ===================== CREATE PORTFOLIO ===================== */

async function handleCreatePortfolio(e) {
  e.preventDefault();

  try {
    const name =
      document.getElementById("portfolioName")?.value.trim();
    const description =
      document.getElementById("portfolioDescription")?.value.trim();

    if (!name) {
      showToast("Portfolio name is required", "error");
      return;
    }

    const portfolio = await api_createPortfolio({
      name,
      description,
    });

    getSocket()?.emit("portfolio_created", portfolio);

    portfolioCreateForm.reset();
    showToast("Portfolio created successfully", "success");

    showView("view-portfolios");
  } catch (err) {
    console.error("[PORTFOLIOS] Create failed:", err);
    showToast("Failed to create portfolio", "error");
  }
}

/* ===================== ACTION HANDLERS ===================== */

function attachPortfolioActions() {
  /* ---- View holdings ---- */

  document.querySelectorAll(".view-holdings-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (!id || !name) return;

      setActivePortfolio(id, name);
      showView("view-holdings");
    };
  });

  /* ---- Delete portfolio ---- */

  document.querySelectorAll(".delete-portfolio-btn").forEach((btn) => {
    btn.onclick = async () => {
      const portfolioId = btn.dataset.id;
      if (!portfolioId) return;

      /* 🔍 Step 1: Check holdings */
      try {
        const res = await api_getHoldings(portfolioId, 1);
        const holdingCount = res?.holdings?.length || 0;

        if (holdingCount > 0) {
          showToast(
            "Please delete all holdings before deleting this portfolio",
            "warning"
          );
          return;
        }
      } catch (err) {
        console.error("[PORTFOLIOS] Holding check failed:", err);
        showToast("Unable to verify holdings", "error");
        return;
      }

      /* ✅ Step 2: Confirm delete */
      const confirmed = await showConfirm(
        "Are you sure you want to delete this portfolio?"
      );
      if (!confirmed) return;

      /* 🗑 Step 3: Delete portfolio */
      try {
        await api_deletePortfolio(portfolioId);
        getSocket()?.emit("portfolio_deleted", { portfolioId });

        showToast("Portfolio deleted", "success");
        loadPortfolios(1);
      } catch (err) {
        console.error("[PORTFOLIOS] Delete failed:", err);
        showToast("Failed to delete portfolio", "error");
      }
    };
  });
}

/* ===================== EXPORTS ===================== */

export { initPortfolios, loadPortfolios };
