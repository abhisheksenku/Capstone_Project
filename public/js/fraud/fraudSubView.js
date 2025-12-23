/* ============================================================================
   FIN-GUARD FRAUD SUBVIEW CONTROLLER
   - Controls Fraud Overview / Analysis / Cases
   - Uses global state (single source of truth)
   - Refresh-safe
   - Breadcrumb-compatible
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  setFraudSubview,
  getFraudSubview,
} from "../core/state.js";

/* ===================== DOM REFERENCES ===================== */

const overview = document.getElementById("fraud-overview-section");
const analysis = document.getElementById("fraud-analysis-section");
const cases = document.getElementById("fraud-cases-section");

/* ===================== CORE API ===================== */

/**
 * Switch fraud sub-view
 * @param {"overview"|"analysis"|"cases"} type
 */
function showFraudSubView(type = "overview") {
  if (!overview || !analysis || !cases) return;

  // ✅ persist via global state
  setFraudSubview(type);

  overview.classList.toggle("hidden", type !== "overview");
  analysis.classList.toggle("hidden", type !== "analysis");
  cases.classList.toggle("hidden", type !== "cases");

  document.dispatchEvent(
    new CustomEvent("fraud:subview", {
      detail: { type },
    })
  );
}

/* ===================== RESTORE ON REFRESH ===================== */

/**
 * Restore fraud subview ONLY when fraud view is active
 */
function restoreFraudSubView() {
  const currentView = sessionStorage.getItem("fg_current_view");
  if (currentView !== "view-fraud") return;

  const subview = getFraudSubview();
  showFraudSubView(subview);
}

/* ===================== EXPORTS ===================== */

export {
  showFraudSubView,
  restoreFraudSubView,
};
