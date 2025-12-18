/* ============================================================================
   FIN-GUARD DASHBOARD
   Loads dashboard KPIs, holdings table, portfolio history, allocation
============================================================================ */

import {
  api_getDashboardSummary,
  api_getDashboardHoldings,
  api_getDashboardHistory,
  api_getDashboardAllocation,
} from "../core/api.js";

import {
  formatMoney,
  formatPercent,
  escapeHtml,
  showToast,
} from "../core/helpers.js";

import {
  updatePortfolioHistory,
  updateAllocation,
} from "./charts.js";

/* ===================== DOM REFERENCES ===================== */

const elTotalInvestment = document.getElementById("metric-total-investment");
const elTotalPL = document.getElementById("metric-total-pl");
const elTodayPL = document.getElementById("metric-today-pl");
const elRisk = document.getElementById("metric-risk");

const holdingsBody = document.getElementById("dashboard-holdings-body");

/* ===================== HELPERS ===================== */

function flash(el, positive = true) {
  if (!el) return;
  el.classList.remove("flash-green", "flash-red");
  void el.offsetWidth;
  el.classList.add(positive ? "flash-green" : "flash-red");
}

/* ============================================================================
   DASHBOARD LOADER
============================================================================ */

async function loadDashboard() {
  console.group("📊 [DASHBOARD] loadDashboard()");
  console.log("→ Starting dashboard load");

  try {
    await Promise.all([
      loadDashboardSummary(),
      loadDashboardHoldings(),
      loadDashboardHistory(),
      loadDashboardAllocation(),
    ]);

    console.log("✅ Dashboard load complete");
  } catch (err) {
    console.error("❌ Dashboard load failed:", err);
  }

  console.groupEnd();
}

/* ===================== KPI SUMMARY ===================== */

async function loadDashboardSummary() {
  console.group("📈 [DASHBOARD] KPI Summary");

  try {
    const data = await api_getDashboardSummary();
    console.log("API response:", data);

    if (!data) {
      console.warn("⚠️ KPI summary empty");
      return;
    }

    elTotalInvestment.textContent = formatMoney(data.totalInvestment);

    elTotalPL.textContent = formatMoney(data.totalPL);
    elTotalPL.classList.toggle("text-emerald-600", data.totalPL >= 0);
    elTotalPL.classList.toggle("text-rose-500", data.totalPL < 0);

    elTodayPL.textContent = formatMoney(data.todaysPL);
    elTodayPL.classList.toggle("text-emerald-600", data.todaysPL >= 0);
    elTodayPL.classList.toggle("text-rose-500", data.todaysPL < 0);

    elRisk.textContent = formatMoney(data.riskValue);

    flash(elTotalPL, data.totalPL >= 0);
    flash(elTodayPL, data.todaysPL >= 0);

    console.log("✅ KPI rendered");
  } catch (err) {
    console.error("❌ KPI load error:", err);
    showToast("Failed to load dashboard summary", "error");
  }

  console.groupEnd();
}

/* ===================== HOLDINGS TABLE ===================== */

async function loadDashboardHoldings() {
  console.group("📋 [DASHBOARD] Holdings");

  try {
    const res = await api_getDashboardHoldings();
    console.log("API response:", res);

    const items = res?.items || [];
    holdingsBody.innerHTML = "";

    if (!items.length) {
      console.warn("⚠️ No holdings found");
      holdingsBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-6 text-slate-500">
            No holdings available
          </td>
        </tr>
      `;
      return;
    }

    items.forEach((h) => {
      const dayClass = h.dayChange >= 0 ? "text-emerald-600" : "text-rose-500";
      const netClass = h.netPL >= 0 ? "text-emerald-600" : "text-rose-500";

      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50 transition";

      row.innerHTML = `
        <td class="px-4 py-3 font-medium">${escapeHtml(h.symbol)}</td>
        <td class="px-4 py-3">${h.qty}</td>
        <td class="px-4 py-3">${formatMoney(h.avg_price)}</td>
        <td class="px-4 py-3">${formatMoney(h.ltp)}</td>
        <td class="px-4 py-3 ${dayClass}">${formatPercent(h.dayChange)}</td>
        <td class="px-4 py-3 ${netClass}">${formatMoney(h.netPL)}</td>
      `;

      holdingsBody.appendChild(row);
    });

    console.log("✅ Holdings rendered:", items.length);
  } catch (err) {
    console.error("❌ Holdings load error:", err);
    showToast("Failed to load dashboard holdings", "error");
  }

  console.groupEnd();
}

/* ===================== PORTFOLIO VALUE HISTORY ===================== */

async function loadDashboardHistory() {
  console.group("📉 [DASHBOARD] Portfolio History");

  try {
    const data = await api_getDashboardHistory();
    console.log("API response:", data);

    if (!Array.isArray(data) || !data.length) {
      console.warn("⚠️ History empty");
      return;
    }

    const labels = data.map((d) => d.date);
    const values = data.map((d) => d.value);

    console.log("→ Updating history chart", { labels, values });
    updatePortfolioHistory(labels, values);

    console.log("✅ History chart updated");
  } catch (err) {
    console.error("❌ History load error:", err);
  }

  console.groupEnd();
}

/* ===================== ASSET ALLOCATION ===================== */

async function loadDashboardAllocation() {
  console.group("🍩 [DASHBOARD] Asset Allocation");

  try {
    const res = await api_getDashboardAllocation();
    console.log("API response:", res);

    const items = res?.items || [];

    if (!items.length) {
      console.warn("⚠️ Allocation empty");
      return;
    }

    const labels = items.map((i) => i.asset);
    const values = items.map((i) => i.percentage);

    console.log("→ Updating allocation chart", { labels, values });
    updateAllocation(labels, values);

    console.log("✅ Allocation chart updated");
  } catch (err) {
    console.error("❌ Allocation load error:", err);
  }

  console.groupEnd();
}

/* ===================== REALTIME REFRESH EVENTS ===================== */

document.addEventListener("portfolio:added", loadDashboard);
document.addEventListener("holding:added", loadDashboard);
document.addEventListener("transaction:added", loadDashboard);
document.addEventListener("dashboard:refresh", loadDashboard);

/* ===================== EXPORT ===================== */

export { loadDashboard };
