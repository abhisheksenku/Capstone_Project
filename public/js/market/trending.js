/* ============================================================================
   FIN-GUARD TRENDING STOCKS
   Lazy load + manual refresh + market panel integration
============================================================================ */

import { api_getTrendingStocks } from "../core/api.js";
import { showToast, escapeHtml } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const trendingList = document.getElementById("trending-list");
const refreshTrendingBtn = document.getElementById("refreshTrendingBtn");

/* ===================== STATE ===================== */

let hasLoadedOnce = false;

/* ============================================================================
   INIT
============================================================================ */

function initTrending() {
  if (!trendingList) return;

  // Manual refresh
  if (refreshTrendingBtn) {
    refreshTrendingBtn.addEventListener("click", () => {
      loadTrending(true);
    });
  }

  // Lazy load when view opens (only first time)
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-trending" && !hasLoadedOnce) {
      loadTrending();
      hasLoadedOnce = true;
    }
  });
}

/* ============================================================================
   LOAD TRENDING
============================================================================ */

async function loadTrending(manual = false) {
  try {
    if (manual) {
      showLoading();
    }

    const res = await api_getTrendingStocks();
    const items = res?.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      renderEmpty();
      return;
    }

    renderTrending(items);
  } catch (err) {
    console.error("[TRENDING] Load failed:", err);
    renderEmpty();
    showToast("Failed to load trending stocks", "error");
  }
}

/* ============================================================================
   RENDERING
============================================================================ */

function renderTrending(items) {
  trendingList.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");

    const change = Number(item.change || 0);
    const changeClass =
      change >= 0 ? "text-emerald-600" : "text-rose-500";

    const currency =
      item.currency === "INR" ? "₹" :
      item.currency === "USD" ? "$" : "";

    card.className =
      "border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:shadow-sm transition cursor-pointer";

    card.innerHTML = `
      <div>
        <div class="font-semibold text-slate-800">
          ${escapeHtml(item.symbol)}
        </div>
        <div class="text-xs text-slate-500">
          ${escapeHtml(item.name || "")}
        </div>
        <div class="text-sm text-slate-600 mt-1">
          ${currency}${item.price}
          <span class="${changeClass}">
            (${change >= 0 ? "+" : ""}${change.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div class="text-xs text-slate-400">
        ${escapeHtml(item.currency || "")}
      </div>
    `;

    // 🔗 Click → open Market panel
    card.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("market:open", {
          detail: { symbol: item.symbol },
        })
      );
    });

    trendingList.appendChild(card);
  });
}

/* ============================================================================
   STATES
============================================================================ */

function showLoading() {
  trendingList.innerHTML = `
    <div class="col-span-full text-center text-slate-400 py-6">
      Loading trending stocks…
    </div>
  `;
}

function renderEmpty() {
  trendingList.innerHTML = `
    <div class="col-span-full text-center text-slate-500 py-6">
      No trending stocks available.
    </div>
  `;
}

/* ============================================================================
   EXPORTS
============================================================================ */

export { initTrending, loadTrending };
