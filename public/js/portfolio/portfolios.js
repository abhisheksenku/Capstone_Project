/* ============================================================================
   FIN-GUARD PORTFOLIOS (FRONTEND)
   Portfolio listing, creation, deletion, pagination

   Pattern:
   - REST for data persistence
   - Socket for realtime notifications
   - Toasts ONLY via socket listener (core/socket.js)

   IMPORTANT:
   - Do NOT show toast here for create/delete
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  api_getPortfolios,
  api_createPortfolio,
  api_deletePortfolio,
} from "../core/api.js";

import {
  STORE_PORTFOLIO_PAGE,
  getSocket,
} from "../core/state.js";

import {
  escapeHtml,
  buildPagination,
  showToast,
} from "../core/helpers.js";

import { showView } from "../layout/navigation.js";

/* ===================== DOM REFERENCES ===================== */

const portfolioList = document.getElementById("portfolio-list");
const paginationContainer = document.getElementById("portfolio-pagination");

const addNewPortfolioBtn = document.getElementById("addNewPortfolioBtn");
const portfolioCreateForm = document.getElementById("portfolioCreateForm");
const createCancelBtn = document.getElementById("createPortfolioCancel");

/* ============================================================================
   INIT
============================================================================ */

function initPortfolios() {
  console.log("[PORTFOLIO] initPortfolios");

  if (addNewPortfolioBtn) {
    addNewPortfolioBtn.addEventListener("click", () => {
      showView("view-portfolio-create");
    });
  }

  if (createCancelBtn) {
    createCancelBtn.addEventListener("click", () => {
      showView("view-portfolios");
    });
  }

  if (portfolioCreateForm) {
    portfolioCreateForm.addEventListener("submit", handleCreatePortfolio);
  }

  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-portfolios") {
      loadPortfolios();
    }
  });
}

/* ============================================================================
   LOAD PORTFOLIOS
============================================================================ */

async function loadPortfolios(page = 1) {
  try {
    if (!portfolioList) return;

    sessionStorage.setItem(STORE_PORTFOLIO_PAGE, page);

    const res = await api_getPortfolios(page);
    const portfolios = res?.portfolios || [];
    const totalPages = res?.pagination?.totalPages || 1;

    portfolioList.innerHTML = "";

    if (!portfolios.length) {
      portfolioList.innerHTML = `
        <div class="text-slate-500 text-center py-6">
          No portfolios found.
        </div>
      `;
      return;
    }

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
              ${escapeHtml(p.description || "")}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              data-id="${p.id}"
              class="view-holdings-btn text-blue-600 text-sm underline"
            >
              View
            </button>

            <button
              data-id="${p.id}"
              class="delete-portfolio-btn text-rose-600 text-sm underline"
            >
              Delete
            </button>
          </div>
        </div>
      `;

      portfolioList.appendChild(card);
    });

    attachPortfolioActions();

    if (paginationContainer) {
      buildPagination(
        paginationContainer,
        page,
        totalPages,
        loadPortfolios
      );
    }
  } catch (err) {
    console.error("[PORTFOLIO] Load failed:", err);
    showToast("Failed to load portfolios", "error");
  }
}

/* ============================================================================
   CREATE PORTFOLIO (REST → SOCKET EMIT ONLY)
============================================================================ */

async function handleCreatePortfolio(e) {
  e.preventDefault();

  try {
    const name = document.getElementById("portfolioName")?.value.trim();
    const description =
      document.getElementById("portfolioDescription")?.value.trim();

    if (!name) {
      showToast("Portfolio name is required", "error");
      return;
    }

    // 1️⃣ REST call
    const portfolio = await api_createPortfolio({ name, description });

    // 2️⃣ SOCKET emit (toast will come from socket.js)
    const socket = getSocket();
    console.log("[PORTFOLIO] socket instance:", socket);

    if (socket) {
      console.log("[PORTFOLIO] emitting portfolio_created");
      socket.emit("portfolio_created", portfolio);
    }

    // 3️⃣ UI navigation only (NO toast here)
    portfolioCreateForm.reset();
    showView("view-portfolios");
    loadPortfolios(1);

  } catch (err) {
    console.error("[PORTFOLIO] Create failed:", err);
    showToast("Failed to create portfolio", "error");
  }
}

/* ============================================================================
   DELETE PORTFOLIO (REST → SOCKET EMIT ONLY)
============================================================================ */

function attachPortfolioActions() {
  document.querySelectorAll(".delete-portfolio-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!id) return;

      if (!confirm("Are you sure you want to delete this portfolio?")) return;

      try {
        await api_deletePortfolio(id);

        const socket = getSocket();
        if (socket) {
          socket.emit("portfolio_deleted", { id });
        }

        const page =
          Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        loadPortfolios(page);
      } catch (err) {
        console.error("[PORTFOLIO] Delete failed:", err);
        showToast("Failed to delete portfolio", "error");
      }
    });
  });

  document.querySelectorAll(".view-holdings-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (!id) return;

      sessionStorage.setItem("activePortfolioId", id);
      showView("view-holdings");
    });
  });
}

/* ============================================================================
   EXPORTS
============================================================================ */

export { initPortfolios, loadPortfolios };
