/* ============================================================================
   FIN-GUARD FRAUD SCORE DISTRIBUTION
   Handles Fraud Score Distribution chart (Overview section)
============================================================================ */

import { api_getFraudScoreDistribution } from "../core/api.js";

let fraudChart = null;

function initFraudScoreDistribution() {
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud") {
      loadFraudScoreDistribution();
    }
  });
}

async function loadFraudScoreDistribution() {
  const canvas = document.getElementById("fraudScoreChart");
  if (!canvas || !window.Chart) return;

  try {
    const res = await api_getFraudScoreDistribution();
    const bins = res?.bins || {};

    if (fraudChart) fraudChart.destroy();

    fraudChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: Object.keys(bins),
        datasets: [
          {
            label: "Transactions",
            data: Object.values(bins),
            backgroundColor: "#3b82f6",
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
              label: (ctx) => `${ctx.raw} transactions`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load fraud score distribution:", err);
  }
}

export { initFraudScoreDistribution };
