/* ============================================================================
   FIN-GUARD BREADCRUMB HANDLER
   Updates breadcrumb text based on active view
============================================================================ */

import { STORE_CURRENT_VIEW } from "../core/state.js";

/* ===================== DOM REFERENCES ===================== */

const breadcrumbOverview = document.getElementById("breadcrumb-overview");
const breadcrumbDivider = document.getElementById("breadcrumb-divider");
const breadcrumbSub = document.getElementById("breadcrumb-sub");

/* ===================== VIEW → LABEL MAP ===================== */

const VIEW_LABELS = {
  "view-overview": "Dashboard",
  "view-portfolios": "Portfolios",
  "view-portfolio-create": "Create Portfolio",
  "view-holdings": "Holdings",
  "view-holding-create": "Add Holding",
  "view-holding-transactions": "Transactions",
  "view-market": "Market",
  "view-watchlist": "Watchlist",
  "view-trending": "Trending",
  "view-fraud": "Fraud Analytics",
  "view-alerts": "Risk Alerts",
  "view-settings": "Settings",
  "view-features": "Premium Features",
};

/* ===================== UPDATE FUNCTION ===================== */

function updateBreadcrumb(viewId) {
  if (!breadcrumbOverview || !breadcrumbSub || !breadcrumbDivider) return;

  // Overview always visible
  breadcrumbOverview.textContent = "Overview";

  const label = VIEW_LABELS[viewId];

  if (!label || viewId === "view-overview") {
    breadcrumbDivider.classList.add("hidden");
    breadcrumbSub.classList.add("hidden");
    return;
  }

  breadcrumbSub.textContent = label;
  breadcrumbDivider.classList.remove("hidden");
  breadcrumbSub.classList.remove("hidden");
}

/* ===================== LISTENERS ===================== */

function initBreadcrumb() {
  // On load (restore)
  const storedView = sessionStorage.getItem(STORE_CURRENT_VIEW);
  if (storedView) {
    updateBreadcrumb(storedView);
  }

  // Listen for view changes dispatched by navigation
  document.addEventListener("view:change", (e) => {
    if (e.detail && e.detail.viewId) {
      updateBreadcrumb(e.detail.viewId);
    }
  });
}

/* ===================== EXPORTS ===================== */

export  {
  initBreadcrumb,
  updateBreadcrumb,
};
