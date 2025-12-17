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

/* ============================================================================
   CHART INITIALIZERS
============================================================================ */

function initDashboardCharts() {
  initPortfolioHistoryChart();
  initAllocationChart();
}

/* ===================== PORTFOLIO HISTORY ===================== */

function initPortfolioHistoryChart() {
  if (!historyCanvas || !window.Chart) return;

  // Destroy existing instance if any
  if (window.portfolioHistoryChart) {
    window.portfolioHistoryChart.destroy();
  }

  const labels = [];
  const values = [];

  window.portfolioHistoryChart = new Chart(historyCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Portfolio Value",
          data: values,
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

  if (window.portfolioAllocationChart) {
    window.portfolioAllocationChart.destroy();
  }

  const labels = [];
  const values = [];

  window.portfolioAllocationChart = new Chart(allocationCanvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
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
   UPDATE HELPERS (CALLED FROM OTHER MODULES)
============================================================================ */

function updatePortfolioHistory(labels, values) {
  if (!window.portfolioHistoryChart) return;

  window.portfolioHistoryChart.data.labels = labels;
  window.portfolioHistoryChart.data.datasets[0].data = values;
  window.portfolioHistoryChart.update();
}

function updateAllocation(labels, values) {
  if (!window.portfolioAllocationChart) return;

  window.portfolioAllocationChart.data.labels = labels;
  window.portfolioAllocationChart.data.datasets[0].data = values;
  window.portfolioAllocationChart.update();
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initDashboardCharts,
  updatePortfolioHistory,
  updateAllocation,
};
