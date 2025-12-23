/* ============================================================================
   FIN-GUARD FRAUD KPIs
   - Loads KPI cards for Fraud Overview
   - Activates ONLY when Fraud view opens
   - Respects Fraud sub-view state (overview / analysis / cases)
============================================================================ */

import { api_getFraudKPIs } from "../core/api.js";
import { showToast } from "../core/helpers.js";
import { showFraudSubView } from "./fraudSubView.js";

/* ===================== DOM REFERENCES ===================== */

const sectionOverview = document.getElementById("fraud-overview-section");

const elDetection = document.getElementById("fraud-kpi-detection");
const elFalsePositives = document.getElementById("fraud-kpi-fp");
const elTotalAnalyzed = document.getElementById("fraud-kpi-total");
const elHighRiskUsers = document.getElementById("fraud-kpi-highrisk");

/* ===================== INIT ===================== */

function initFraudKPIs() {
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId !== "view-fraud") return;

    const subview =
      sessionStorage.getItem("fraudSubview") || "overview";

    // Restore correct subview
    showFraudSubView(subview);

    // Load KPIs ONLY for overview
    if (subview === "overview") {
      loadFraudKPIs();
    }
  });

  // Realtime refresh hooks
  document.addEventListener("fraud:refresh", () => {
    if (
      sessionStorage.getItem("fraudSubview") === "overview"
    ) {
      loadFraudKPIs();
    }
  });

  document.addEventListener("fraud:alert", () => {
    if (
      sessionStorage.getItem("fraudSubview") === "overview"
    ) {
      loadFraudKPIs();
    }
  });
}

/* ===================== LOAD KPIs ===================== */

async function loadFraudKPIs() {
  try {
    if (!elDetection || !sectionOverview) return;

    const data = await api_getFraudKPIs();
    if (!data) return;

    elDetection.textContent = formatPercent(
      data.detection_rate ?? data.detectionRate
    );

    elFalsePositives.textContent = formatPercent(
      data.false_positive_rate ?? data.falsePositiveRate
    );

    elTotalAnalyzed.textContent =
      data.total_analyzed ?? data.totalAnalyzed ?? 0;

    elHighRiskUsers.textContent =
      data.high_risk_users ?? data.highRiskUsers ?? 0;
  } catch (err) {
    console.error("[FRAUD][KPIs] Load failed:", err);
    showToast("Failed to load fraud KPIs", "error");
  }
}

/* ===================== HELPERS ===================== */

function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(2)}%`;
}

/* ===================== EXPORTS ===================== */

export { initFraudKPIs, loadFraudKPIs };
