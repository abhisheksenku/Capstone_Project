/* ============================================================================
   FIN-GUARD MARKET
   Symbol search, autocomplete, market panel, mini chart, watchlist
============================================================================ */

import {
  api_searchMarket,
  api_getMarketQuote,
  api_getMarketHistory,
  api_addToWatchlist,
  api_removeFromWatchlist,
  api_getWatchlist,
} from "../core/api.js";

import { showToast, escapeHtml } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const marketSearchInput = document.getElementById("marketSearch");
const marketSearchBtn = document.getElementById("marketSearchBtn");
const marketAutoComplete = document.getElementById("marketAutoComplete");
const marketResult = document.getElementById("marketResult");

// Slide-in panel
const marketPanel = document.getElementById("market-panel");
const closeMarketPanelBtn = document.getElementById("closeMarketPanel");

// Panel content
const marketTitle = document.getElementById("market-title");
const marketLivePrice = document.getElementById("market-live-price");
const marketExtra = document.getElementById("market-extra");
const marketMiniChartCanvas = document.getElementById("market-mini-chart");
const addToWatchlistBtn = document.getElementById("addToWatchlistBtn");

/* ===================== STATE ===================== */

let activeMarketSymbol = null;
let marketMiniChart = null;

/* ============================================================================
   INIT
============================================================================ */

function initMarket() {
  if (marketSearchBtn) {
    marketSearchBtn.addEventListener("click", handleSearch);
  }

  if (marketSearchInput) {
    marketSearchInput.addEventListener("input", handleAutoComplete);
  }

  if (closeMarketPanelBtn) {
    closeMarketPanelBtn.addEventListener("click", closeMarketPanel);
  }

  // Unified open handler (heatmap / trending / watchlist)
  document.addEventListener("market:open", async (e) => {
    const symbol = e.detail?.symbol;
    if (!symbol) return;

    try {
      const data = await api_getMarketQuote(symbol);
      openMarketPanel(data);
    } catch (err) {
      console.error("[MARKET] Quote fetch failed:", err);
      showToast("Failed to load market data", "error");
    }
  });

  // Close autocomplete on outside click
  document.addEventListener("click", (e) => {
    if (
      marketAutoComplete &&
      !marketAutoComplete.contains(e.target) &&
      e.target !== marketSearchInput
    ) {
      marketAutoComplete.classList.add("hidden");
    }
  });
}

/* ============================================================================
   SEARCH
============================================================================ */

async function handleSearch() {
  const symbol = marketSearchInput?.value.trim();
  if (!symbol) return;

  try {
    const data = await api_getMarketQuote(symbol);
    renderMarketResult(data);
    openMarketPanel(data);
  } catch {
    showToast("Symbol not found", "error");
  }
}

/* ============================================================================
   AUTOCOMPLETE
============================================================================ */

let autoCompleteTimeout = null;

function handleAutoComplete() {
  const query = marketSearchInput?.value.trim();

  if (!query || query.length < 2) {
    marketAutoComplete.classList.add("hidden");
    return;
  }

  clearTimeout(autoCompleteTimeout);

  autoCompleteTimeout = setTimeout(async () => {
    try {
      const res = await api_searchMarket(query);
      renderAutoComplete(res?.results || []);
    } catch {
      marketAutoComplete.classList.add("hidden");
    }
  }, 300);
}

function renderAutoComplete(list) {
  if (!marketAutoComplete) return;

  marketAutoComplete.innerHTML = "";

  if (!list.length) {
    marketAutoComplete.classList.add("hidden");
    return;
  }

  list.forEach((item) => {
    const li = document.createElement("li");
    li.className = "px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm";

    li.textContent = `${item.symbol} – ${item.name || ""}`;

    li.onclick = () => {
      marketSearchInput.value = item.symbol;
      marketAutoComplete.classList.add("hidden");
      handleSearch();
    };

    marketAutoComplete.appendChild(li);
  });

  marketAutoComplete.classList.remove("hidden");
}

/* ============================================================================
   RESULT RENDERING
============================================================================ */

function renderMarketResult(data) {
  if (!marketResult || !data) return;

  marketResult.innerHTML = `
    <div class="text-lg font-semibold text-slate-800">
      ${escapeHtml(data.symbol)}
    </div>
    <div class="text-sm text-slate-500">
      ${escapeHtml(data.name || "")}
    </div>
  `;

  marketResult.classList.remove("hidden");
}

/* ============================================================================
   MARKET PANEL
============================================================================ */

async function openMarketPanel(data) {
  if (!marketPanel || !data) return;

  activeMarketSymbol = data.symbol;

  const currency = data.currency === "USD" ? "$" : "₹";

  const change = data.change_percent ?? data.change ?? 0;

  marketTitle.textContent = data.symbol;
  marketLivePrice.textContent = `${currency}${data.price}`;

  marketExtra.innerHTML = `
    <div>Open: ${currency}${data.open ?? "--"}</div>
    <div>High: ${currency}${data.high ?? "--"}</div>
    <div>Low: ${currency}${data.low ?? "--"}</div>
    <div>Prev Close: ${currency}${data.prevClose ?? "--"}</div>
    <div class="${change >= 0 ? "text-emerald-600" : "text-rose-600"}">
      Change: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%
    </div>
  `;

  await updateWatchlistButton(data.symbol);
  await renderMiniChart(data.symbol);

  marketPanel.classList.remove("hidden");
}

function closeMarketPanel() {
  marketPanel?.classList.add("hidden");
}

/* ============================================================================
   MINI CHART
============================================================================ */

async function renderMiniChart(symbol) {
  if (!marketMiniChartCanvas) return;

  marketMiniChart?.destroy();
  marketMiniChart = null;

  try {
    const items = await api_getMarketHistory(symbol); // ✅ array directly

    if (!Array.isArray(items) || !items.length) return;

    marketMiniChart = new Chart(marketMiniChartCanvas, {
      type: "line",
      data: {
        labels: items.map((p) =>
          new Date(p.time).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })
        ),
        datasets: [
          {
            data: items.map((p) => p.price),
            tension: 0.4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: true },
        },
      },
    });
  } catch (err) {
    console.warn("[MARKET] Mini chart failed", err);
  }
}

/* ============================================================================
   WATCHLIST
============================================================================ */

async function updateWatchlistButton(symbol) {
  if (!addToWatchlistBtn) return;

  const res = await api_getWatchlist(1);
  const exists = (res?.items || []).some((i) => i.symbol === symbol);

  if (exists) {
    addToWatchlistBtn.textContent = "Remove from Watchlist";
    addToWatchlistBtn.onclick = handleRemoveFromWatchlist;
  } else {
    addToWatchlistBtn.textContent = "Add to Watchlist";
    addToWatchlistBtn.onclick = handleAddToWatchlist;
  }
}

async function handleAddToWatchlist() {
  if (!activeMarketSymbol) return;

  try {
    await api_addToWatchlist(activeMarketSymbol);
    showToast("Added to watchlist", "success");
    updateWatchlistButton(activeMarketSymbol);
  } catch {
    showToast("Already in watchlist", "info");
  }
}

async function handleRemoveFromWatchlist() {
  if (!activeMarketSymbol) return;

  try {
    await api_removeFromWatchlist(activeMarketSymbol);
    showToast("Removed from watchlist", "success");
    updateWatchlistButton(activeMarketSymbol);
  } catch {
    showToast("Failed to remove from watchlist", "error");
  }
}
/* ===================== LIVE MARKET PANEL UPDATE ===================== */
document.addEventListener("market:ticker", (e) => {
  if (!activeMarketSymbol) return;

  const updates = e.detail || [];
  const match = updates.find(
    (u) => u.symbol === activeMarketSymbol
  );
  if (!match) return;

  const prev = Number(
    marketLivePrice.textContent.replace(/[₹$,]/g, "")
  );

  marketLivePrice.textContent = `₹${match.price.toFixed(2)}`;

  const cls =
    match.price > prev ? "flash-green" : "flash-red";

  marketLivePrice.classList.remove("flash-green", "flash-red");
  void marketLivePrice.offsetWidth; // force reflow
  marketLivePrice.classList.add(cls);
});
document.addEventListener("market:refresh", () => {
  if (!activeMarketSymbol) return;

  api_getMarketQuote(activeMarketSymbol)
    .then(openMarketPanel)
    .catch(() => {});
});

/* ============================================================================
   EXPORT
============================================================================ */

export { initMarket };
