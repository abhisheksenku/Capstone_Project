/* ============================================================================
   FIN-GUARD DASHBOARD CHARTS
   Portfolio history + asset allocation charts
============================================================================ */

import { formatMoney } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const historyCanvas = document.getElementById("portfolio-history-chart");
const allocationCanvas = document.getElementById(
  "portfolio-allocation-chart"
);

/* ===================== GLOBAL CHART INSTANCES ===================== */

let portfolioHistoryChart = null;
let portfolioAllocationChart = null;

/* ============================================================================
   INIT (CALLED ON DASHBOARD LOAD)
============================================================================ */

function initDashboardCharts() {
  if (!portfolioHistoryChart) {
    initPortfolioHistoryChart();
  }

  if (!portfolioAllocationChart) {
    initAllocationChart();
  }
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
        x: {
          grid: { display: false },
        },
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
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.label}: ${formatMoney(ctx.parsed)}`,
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
