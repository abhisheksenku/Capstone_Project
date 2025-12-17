/* ============================================================================
   FIN-GUARD WATCHLIST
   Load, render, enrich (live price), refresh, remove watchlist symbols
============================================================================ */

import {
  api_getWatchlist,
  api_removeFromWatchlist,
  api_getMarketQuote,
} from "../core/api.js";

import { STORE_WATCHLIST_PAGE } from "../core/state.js";

import { showToast, escapeHtml, buildPagination } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const watchlistItems = document.getElementById("watchlist-items");
const watchlistEmpty = document.getElementById("watchlist-empty");
const watchlistPagination = document.getElementById("watchlist-pagination");
const refreshWatchlistBtn = document.getElementById("refreshWatchlistBtn");

/* ============================================================================ */

function initWatchlist() {
  if (refreshWatchlistBtn) {
    refreshWatchlistBtn.addEventListener("click", () => loadWatchlist(1));
  }

  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-watchlist") {
      const page = Number(sessionStorage.getItem(STORE_WATCHLIST_PAGE)) || 1;
      loadWatchlist(page);
    }
  });
}
document.addEventListener("watchlist:refresh", () => {
  const page = Number(sessionStorage.getItem(STORE_WATCHLIST_PAGE)) || 1;
  loadWatchlist(page);
});
/* ===================== LIVE PRICE UPDATES ===================== */
document.addEventListener("market:ticker", (e) => {
  const updates = e.detail;
  if (!Array.isArray(updates)) return;

  updates.forEach((u) => {
    const el = document.querySelector(
      `.watchlist-price[data-symbol="${u.symbol}"]`
    );
    if (!el) return;

    const prev = Number(
      el.textContent.replace(/[₹()%+−]/g, "")
    );

    const cls =
      u.price > prev ? "flash-green" : "flash-red";

    el.innerHTML = `
      ₹${u.price.toFixed(2)}
      <span class="${u.change >= 0 ? "text-emerald-600" : "text-rose-600"}">
        (${u.change >= 0 ? "+" : ""}${u.change.toFixed(2)}%)
      </span>
    `;

    el.classList.remove("flash-green", "flash-red");
    void el.offsetWidth;
    el.classList.add(cls);
  });
});

/* ============================================================================ */

async function loadWatchlist(page = 1) {
  try {
    if (!watchlistItems) return;

    sessionStorage.setItem(STORE_WATCHLIST_PAGE, page);

    const res = await api_getWatchlist(page);
    const items = res?.items || [];
    const totalPages = res?.pagination?.pages || 1;

    watchlistItems.innerHTML = "";

    if (!items.length) {
      renderEmpty();
      return;
    }

    watchlistEmpty?.classList.add("hidden");

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className =
        "border border-slate-200 rounded-lg p-4 flex justify-between items-center";

      card.innerHTML = `
        <div>
          <div class="font-semibold text-slate-800">
            ${escapeHtml(item.symbol)}
          </div>

          <div
            class="text-sm text-slate-500 watchlist-price"
            data-symbol="${item.symbol}"
          >
            Loading price…
          </div>
        </div>

        <button
          data-symbol="${item.symbol}"
          class="remove-watchlist-btn text-rose-600 text-sm underline"
        >
          Remove
        </button>
      `;

      watchlistItems.appendChild(card);

      enrichPrice(card, item.symbol);
    });

    attachRemoveHandlers();

    buildPagination(watchlistPagination, page, totalPages, loadWatchlist);
  } catch (err) {
    console.error("[WATCHLIST] Load failed:", err);
    showToast("Failed to load watchlist", "error");
  }
}

/* ============================================================================ */

async function enrichPrice(card, symbol) {
  const priceEl = card.querySelector(".watchlist-price");
  if (!priceEl) return;

  try {
    const data = await api_getMarketQuote(symbol);

    const change = data.change_percent ?? data.change ?? 0;

    const cls = change >= 0 ? "text-emerald-600" : "text-rose-600";

    priceEl.innerHTML = `
      ₹${data.price}
      <span class="${cls}">
        (${change >= 0 ? "+" : ""}${change.toFixed(2)}%)
      </span>
    `;
  } catch {
    priceEl.textContent = "Price unavailable";
  }
}

/* ============================================================================ */

function attachRemoveHandlers() {
  document.querySelectorAll(".remove-watchlist-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const symbol = btn.dataset.symbol;
      if (!symbol) return;

      try {
        await api_removeFromWatchlist(symbol);
        showToast("Removed from watchlist", "success");

        const page = Number(sessionStorage.getItem(STORE_WATCHLIST_PAGE)) || 1;
        loadWatchlist(page);
      } catch {
        showToast("Failed to remove symbol", "error");
      }
    });
  });
}

/* ============================================================================ */

function renderEmpty() {
  watchlistItems.innerHTML = "";
  watchlistEmpty?.classList.remove("hidden");
  watchlistPagination.innerHTML = "";
}

/* ============================================================================ */

export { initWatchlist, loadWatchlist };
