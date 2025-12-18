/* ============================================================================
   FIN-GUARD FRAUD KPIs
   Handles Fraud Overview KPI cards
============================================================================ */

import { api_getFraudKPIs } from "../core/api.js";
import { showToast } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const sectionOverview = document.getElementById("fraud-overview-section");

const elDetection = document.getElementById("fraud-kpi-detection");
const elFalsePositives = document.getElementById("fraud-kpi-fp");
const elTotalAnalyzed = document.getElementById("fraud-kpi-total");
const elHighRiskUsers = document.getElementById("fraud-kpi-highrisk");

/* ============================================================================
   INIT
============================================================================ */

function initFraudKPIs() {
  // Load KPIs when fraud OVERVIEW opens
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud") {
      showOverviewSection();
      loadFraudKPIs();
    }
  });

  // Realtime refresh (registered ONCE)
  document.addEventListener("fraud:alert", loadFraudKPIs);
  document.addEventListener("fraud:refresh", loadFraudKPIs);
}

/* ============================================================================
   SECTION VISIBILITY
============================================================================ */

function showOverviewSection() {
  sectionOverview?.classList.remove("hidden");
}

/* ============================================================================
   LOAD KPIs
============================================================================ */

async function loadFraudKPIs() {
  try {
    if (!elDetection) return;

    const data = await api_getFraudKPIs();
    if (!data) return;

    elDetection.textContent = `${Number(
      data.detection_rate ?? data.detectionRate ?? 0
    ).toFixed(2)}%`;

    elFalsePositives.textContent = `${Number(
      data.false_positive_rate ?? data.falsePositiveRate ?? 0
    ).toFixed(2)}%`;

    elTotalAnalyzed.textContent =
      data.total_analyzed ?? data.totalAnalyzed ?? 0;

    elHighRiskUsers.textContent =
      data.high_risk_users ?? data.highRiskUsers ?? 0;
  } catch (err) {
    console.error("Failed to load fraud KPIs:", err);
    showToast("Failed to load fraud KPIs", "error");
  }
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initFraudKPIs,
  loadFraudKPIs,
};
