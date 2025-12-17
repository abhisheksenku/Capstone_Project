/* ============================================================================
   FIN-GUARD DASHBOARD
   Loads dashboard KPIs and holdings table
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  api_getDashboardSummary,
  api_getDashboardHoldings,
} from "../core/api.js";

import {
  formatMoney,
  formatPercent,
  formatDate,
  escapeHtml,
  showToast,
} from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

// KPI elements
const elTotalInvestment = document.getElementById("metric-total-investment");
const elTotalPL = document.getElementById("metric-total-pl");
const elTodayPL = document.getElementById("metric-today-pl");
const elRisk = document.getElementById("metric-risk");

// Holdings table body
const holdingsBody = document.getElementById("dashboard-holdings-body");
function flash(el, positive = true) {
  if (!el) return;
  el.classList.remove("flash-green", "flash-red");
  void el.offsetWidth;
  el.classList.add(positive ? "flash-green" : "flash-red");
}

/* ============================================================================
   DASHBOARD LOADER
============================================================================ */

/**
 * Entry function called from init.js
 */
async function loadDashboard() {
  await Promise.all([loadDashboardSummary(), loadDashboardHoldings()]);
}

/* ===================== KPI SUMMARY ===================== */

async function loadDashboardSummary() {
  try {
    const data = await api_getDashboardSummary();
    if (!data) return;

    if (elTotalInvestment) {
      elTotalInvestment.textContent = formatMoney(data.totalInvestment);
    }

    if (elTotalPL) {
      elTotalPL.textContent = formatMoney(data.totalPL);
      elTotalPL.classList.toggle("text-emerald-600", data.totalPL >= 0);
      elTotalPL.classList.toggle("text-rose-500", data.totalPL < 0);
    }

    if (elTodayPL) {
      elTodayPL.textContent = formatMoney(data.todayPL);
      elTodayPL.classList.toggle("text-emerald-600", data.todayPL >= 0);
      elTodayPL.classList.toggle("text-rose-500", data.todayPL < 0);
    }

    if (elRisk) {
      elRisk.textContent = formatPercent(data.var99);
    }
    flash(elTotalPL, data.totalPL >= 0);
    flash(elTodayPL, data.todayPL >= 0);
  } catch (err) {
    console.error("Dashboard summary load failed:", err);
    showToast("Failed to load dashboard summary", "error");
  }
}

/* ===================== HOLDINGS TABLE ===================== */

async function loadDashboardHoldings() {
  try {
    if (!holdingsBody) return;

    const data = await api_getDashboardHoldings();
    holdingsBody.innerHTML = "";

    if (!data || !data.length) {
      holdingsBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-6 text-slate-500">
            No holdings available
          </td>
        </tr>
      `;
      return;
    }

    data.forEach((h) => {
      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50 transition";

      const dayClass = h.dayChange >= 0 ? "text-emerald-600" : "text-rose-500";
      const netClass = h.netPL >= 0 ? "text-emerald-600" : "text-rose-500";

      row.innerHTML = `
        <td class="px-4 sm:px-6 py-3 font-medium">
          ${escapeHtml(h.symbol)}
        </td>
        <td class="px-4 sm:px-6 py-3">
          ${h.quantity}
        </td>
        <td class="px-4 sm:px-6 py-3">
          ${formatMoney(h.avgPrice)}
        </td>
        <td class="px-4 sm:px-6 py-3">
          ${formatMoney(h.ltp)}
        </td>
        <td class="px-4 sm:px-6 py-3 ${dayClass}">
          ${formatPercent(h.dayChange)}
        </td>
        <td class="px-4 sm:px-6 py-3 ${netClass}">
          ${formatMoney(h.netPL)}
        </td>
      `;

      holdingsBody.appendChild(row);
    });
  } catch (err) {
    console.error("Dashboard holdings load failed:", err);
    showToast("Failed to load dashboard holdings", "error");
  }
}
/* ===================== REALTIME PORTFOLIO UPDATE ===================== */
document.addEventListener("portfolio:added", () => {
  loadDashboard();
});

document.addEventListener("holding:added", () => {
  loadDashboard();
});

document.addEventListener("transaction:added", () => {
  loadDashboard();
});
document.addEventListener("dashboard:refresh", () => {
  loadDashboard();
});

/* ============================================================================
   EXPORTS
============================================================================ */

export { loadDashboard };
