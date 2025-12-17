/* ============================================================================
   FIN-GUARD GOLD PRICES (PREMIUM DATA ONLY)
============================================================================ */

import {
  api_getGoldPrices,
} from "../core/api.js";

import { showToast, formatMoney } from "../core/helpers.js";

/* ===================== DOM ===================== */

const elYesterdayPrice = document.getElementById("gold-yesterday-price");
const elYesterdayChange = document.getElementById("gold-yesterday-change");

const elTodayPrice = document.getElementById("gold-today-price");
const elTodayChange = document.getElementById("gold-today-change");

const goldChartCanvas = document.getElementById("gold-7day-chart");

let goldTrendChart = null;

console.log("[GOLD] gold.js loaded");

/* ===================== LOAD ===================== */

async function loadGoldPrices(source = "unknown") {
  console.log(`[GOLD] loadGoldPrices() from: ${source}`);

  try {
    // 1️⃣ SUMMARY
    const summary = await api_getGoldPrices();
    console.log("[GOLD] Summary response:", summary);

    updateSummary(summary);

    // 2️⃣ HISTORY (chart)
    const historyRes = await fetch("/api/premium/gold/history", {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    });

    const historyData = await historyRes.json();
    console.log("[GOLD] History response:", historyData);

    updateGoldChart(historyData.history || []);
  } catch (err) {
    console.error("[GOLD] Load failed:", err);
    showToast("Failed to load gold data", "error");
  }
}

/* ===================== SUMMARY ===================== */

function updateSummary(data) {
  console.log("[GOLD] updateSummary()", data);

  if (elYesterdayPrice) {
    elYesterdayPrice.textContent = formatMoney(data?.yesterday?.price);
  }

  if (elYesterdayChange) {
    elYesterdayChange.textContent = "—";
  }

  if (elTodayPrice) {
    elTodayPrice.textContent = formatMoney(data?.today?.price);
  }

  if (elTodayChange) {
    elTodayChange.textContent = `${data?.today?.percent?.toFixed(2) || 0}%`;
  }
}

/* ===================== CHART ===================== */

function updateGoldChart(trend) {
  console.log("[GOLD] updateGoldChart()", trend);

  if (!goldChartCanvas || !window.Chart || !trend.length) {
    console.warn("[GOLD] Chart skipped");
    return;
  }

  const labels = trend.map((d) =>
    new Date(d.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    })
  );

  const values = trend.map((d) => d.price);

  if (goldTrendChart) {
    goldTrendChart.destroy();
  }

  goldTrendChart = new Chart(goldChartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: {
            callback: (v) => formatMoney(v),
          },
        },
      },
    },
  });

  console.log("[GOLD] Chart rendered");
}

/* ===================== EXPORT ===================== */

export { loadGoldPrices };
