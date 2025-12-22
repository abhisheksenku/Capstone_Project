/* ============================================================================
   FIN-GUARD DASHBOARD CHARTS
   Handles:
   - Portfolio value history (line)
   - Asset allocation (doughnut)
============================================================================ */

import { formatMoney } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const historyCanvas = document.getElementById("portfolio-history-chart");
const allocationCanvas = document.getElementById(
  "portfolio-allocation-chart"
);

/* ===================== COLOR PALETTE ===================== */

const ALLOCATION_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#f59e0b", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#0d9488", // teal
  "#ea580c", // orange
  "#475569", // slate
];

/* ===================== CHART INSTANCES ===================== */

let portfolioHistoryChart = null;
let portfolioAllocationChart = null;

/* ============================================================================
   INIT (CALLED ON DASHBOARD VIEW OPEN)
============================================================================ */

function initDashboardCharts() {
  if (!portfolioHistoryChart) initPortfolioHistoryChart();
  if (!portfolioAllocationChart) initAllocationChart();
}

/* ===================== PORTFOLIO HISTORY ===================== */

function initPortfolioHistoryChart() {
  if (!historyCanvas || !window.Chart) return;

  portfolioHistoryChart = new Chart(historyCanvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Portfolio Value",
          data: [],
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => formatMoney(ctx.parsed.y),
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          ticks: {
            callback: (v) => formatMoney(v),
          },
        },
      },
    },
  });
}

/* ===================== ASSET ALLOCATION ===================== */

function initAllocationChart() {
  if (!allocationCanvas || !window.Chart) return;

  portfolioAllocationChart = new Chart(allocationCanvas, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          borderWidth: 1,
          backgroundColor: [],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.label}: ${ctx.parsed.toFixed(2)}%`,
          },
        },
      },
    },
  });
}

/* ============================================================================
   UPDATE HELPERS (CALLED FROM dashboard.js)
============================================================================ */

function updatePortfolioHistory(labels = [], values = []) {
  if (!portfolioHistoryChart) return;

  portfolioHistoryChart.data.labels = labels;
  portfolioHistoryChart.data.datasets[0].data = values;
  portfolioHistoryChart.update();
}

function updateAllocation(labels = [], values = []) {
  if (!portfolioAllocationChart) return;

  portfolioAllocationChart.data.labels = labels;
  portfolioAllocationChart.data.datasets[0].data = values;

  portfolioAllocationChart.data.datasets[0].backgroundColor =
    labels.map((_, i) => ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]);

  portfolioAllocationChart.update();
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initDashboardCharts,
  updatePortfolioHistory,
  updateAllocation,
};
