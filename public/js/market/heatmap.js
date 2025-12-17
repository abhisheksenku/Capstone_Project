/* ============================================================================
   FIN-GUARD MARKET HEATMAP
   Renders live price heatmap tiles (lazy + manual refresh)
============================================================================ */

import { api_getMarketHeatmap } from "../core/api.js";
import { showToast } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const heatmapGrid = document.getElementById("heatmap-grid");
const refreshHeatmapBtn = document.getElementById("refreshHeatmapBtn");

/* ============================================================================
   INIT
============================================================================ */

function initHeatmap() {
  if (!heatmapGrid) return;

  // Load when Market view is opened (lazy load)
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-market") {
      loadHeatmap();
    }
  });

  // Manual refresh
  if (refreshHeatmapBtn) {
    refreshHeatmapBtn.addEventListener("click", () => {
      loadHeatmap(true);
    });
  }
}

/* ============================================================================
   LOAD HEATMAP DATA
============================================================================ */

async function loadHeatmap(manual = false) {
  try {
    if (manual) {
      showLoading();
    }

    const res = await api_getMarketHeatmap();
    const items = res?.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      renderEmpty();
      return;
    }

    renderHeatmap(items);
  } catch (err) {
    console.error("[HEATMAP] Load failed:", err);
    renderEmpty();
    showToast("Failed to load market heatmap", "error");
  }
}

/* ============================================================================
   RENDERING
============================================================================ */

function renderHeatmap(items) {
  if (!heatmapGrid) return;

  heatmapGrid.innerHTML = "";

  items.forEach((item) => {
    const tile = document.createElement("div");

    // Backend provides `change`
    const change = Number(item.change || 0);
    const colorClass = getColorClass(change);

    tile.className = `
      p-3 rounded-lg text-center text-sm font-medium
      border shadow-sm cursor-pointer
      transition hover:scale-[1.02]
      ${colorClass}
    `;

    tile.innerHTML = `
      <div class="font-semibold">${item.symbol}</div>
      <div class="text-xs mt-1">
        ${change >= 0 ? "+" : ""}${change.toFixed(2)}%
      </div>
    `;

    // 🔗 Click → open market panel
    tile.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("market:open", {
          detail: { symbol: item.symbol },
        })
      );
    });

    heatmapGrid.appendChild(tile);
  });
}

/* ============================================================================
   STATES
============================================================================ */

function showLoading() {
  heatmapGrid.innerHTML = `
    <div class="col-span-full text-center text-slate-400 py-6">
      Loading market data…
    </div>
  `;
}

function renderEmpty() {
  heatmapGrid.innerHTML = `
    <div class="col-span-full text-center text-slate-500 py-6">
      No market data available
    </div>
  `;
}

/* ============================================================================
   COLOR LOGIC
============================================================================ */

function getColorClass(change) {
  if (change > 2) return "bg-emerald-100 text-emerald-700";
  if (change > 0) return "bg-emerald-50 text-emerald-600";
  if (change < -2) return "bg-rose-100 text-rose-700";
  if (change < 0) return "bg-rose-50 text-rose-600";
  return "bg-slate-100 text-slate-600";
}

/* ============================================================================
   EXPORT
============================================================================ */

export { initHeatmap };
