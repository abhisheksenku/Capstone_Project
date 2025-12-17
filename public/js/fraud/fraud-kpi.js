/* ============================================================================
   FIN-GUARD FRAUD KPIs
   Renders fraud overview KPI cards (User View)
============================================================================ */

import { api_getFraudKPIs } from "../core/api.js";
import { showToast } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const elDetection = document.getElementById("fraud-kpi-detection");
const elFalsePositives = document.getElementById("fraud-kpi-fp");
const elTotalAnalyzed = document.getElementById("fraud-kpi-total");
const elHighRiskUsers = document.getElementById(
  "fraud-kpi-highrisk"
);

/* ============================================================================
   INIT
============================================================================ */

function initFraudKPIs() {
  // Load KPIs when fraud view opens
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud") {
      loadFraudKPIs();
    }
  });
}

/* ============================================================================
   LOAD KPIs
============================================================================ */

async function loadFraudKPIs() {
  try {
    const data = await api_getFraudKPIs();

    if (!data) return;

    if (elDetection) {
      elDetection.textContent = `${data.detectionRate || 0}%`;
    }

    if (elFalsePositives) {
      elFalsePositives.textContent = `${data.falsePositiveRate || 0}%`;
    }

    if (elTotalAnalyzed) {
      elTotalAnalyzed.textContent = data.totalAnalyzed || 0;
    }

    if (elHighRiskUsers) {
      elHighRiskUsers.textContent = data.highRiskUsers || 0;
    }
  } catch (err) {
    console.error("Failed to load fraud KPIs:", err);
    showToast("Failed to load fraud KPIs", "error");
  }
}
/* ===================== REALTIME FRAUD UPDATE ===================== */
document.addEventListener("fraud:alert", () => {
  loadFraudKPIs();
});
document.addEventListener("fraud:refresh", () => {
  loadFraudKPIs();
});
/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initFraudKPIs,
  loadFraudKPIs,
};
