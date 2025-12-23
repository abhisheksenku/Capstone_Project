/* ============================================================================
   FIN-GUARD BREADCRUMB HANDLER
   - Context-aware breadcrumb navigation
   - Portfolio → Holdings → Transactions
   - Fraud → Overview / Analysis / Cases
   - Refresh-safe, state-driven, clickable
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  STORE_CURRENT_VIEW,
  getActivePortfolioId,
  getActivePortfolioName,
  getActiveHoldingId,
  getActiveHoldingSymbol,
  getFraudSubview,
} from "../core/state.js";

import { showView } from "./navigation.js";
import { showFraudSubView } from "../fraud/fraudSubView.js";

/* ===================== DOM REFERENCES ===================== */

const breadcrumbOverview = document.getElementById("breadcrumb-overview");
const breadcrumbDivider = document.getElementById("breadcrumb-divider");
const breadcrumbSub = document.getElementById("breadcrumb-sub");

/* ===================== SAFETY ===================== */

if (!breadcrumbOverview || !breadcrumbDivider || !breadcrumbSub) {
  console.warn("[BREADCRUMB] DOM not ready");
}

/* ===================== STATE READERS ===================== */

function getPortfolio() {
  return {
    id: getActivePortfolioId(),
    name: getActivePortfolioName(),
  };
}

function getHolding() {
  return {
    id: getActiveHoldingId(),
    symbol: getActiveHoldingSymbol(),
  };
}

/* ===================== UI HELPERS ===================== */

function clearSub() {
  breadcrumbDivider.classList.add("hidden");
  breadcrumbSub.classList.add("hidden");
  breadcrumbSub.innerHTML = "";
}

function showSub(html) {
  breadcrumbDivider.classList.remove("hidden");
  breadcrumbSub.classList.remove("hidden");
  breadcrumbSub.innerHTML = html;
}

/* ===================== TRAIL BUILDERS ===================== */

function buildHoldingsTrail() {
  const portfolio = getPortfolio();
  if (!portfolio.id) return "";

  return `
    <span class="cursor-pointer text-blue-600" data-view="view-portfolios">
      Portfolios
    </span>
    /
    <span class="font-medium">${portfolio.name}</span>
    /
    <span class="font-medium">Holdings</span>
  `;
}

function buildTransactionsTrail() {
  const portfolio = getPortfolio();
  const holding = getHolding();

  if (!portfolio.id || !holding.id) return "";

  return `
    <span class="cursor-pointer text-blue-600" data-view="view-portfolios">
      Portfolios
    </span>
    /
    <span class="cursor-pointer text-blue-600" data-view="view-holdings">
      ${portfolio.name}
    </span>
    /
    <span class="font-medium">${holding.symbol}</span>
    /
    <span class="font-medium">Transactions</span>
  `;
}

function buildFraudTrail() {
  const sub = getFraudSubview();

  if (sub === "analysis") {
    return `
      <span class="cursor-pointer text-blue-600" data-fraud-root>
        Fraud Analytics
      </span>
      /
      <span class="font-medium">Analysis</span>
    `;
  }

  if (sub === "cases") {
    return `
      <span class="cursor-pointer text-blue-600" data-fraud-root>
        Fraud Analytics
      </span>
      /
      <span class="font-medium">Cases</span>
    `;
  }

  return `<span class="font-medium">Fraud Analytics</span>`;
}

/* ===================== UPDATE ===================== */

function updateBreadcrumb(viewId) {
  if (!breadcrumbOverview) return;

  // Root breadcrumb
  breadcrumbOverview.textContent = "Overview";
  breadcrumbOverview.onclick = () => showView("view-overview");

  clearSub();

  let html = "";

  switch (viewId) {
    case "view-portfolios":
      html = `<span class="font-medium">Portfolios</span>`;
      break;

    case "view-holdings":
      html = buildHoldingsTrail();
      break;

    case "view-holding-transactions":
      html = buildTransactionsTrail();
      break;

    case "view-fraud":
      html = buildFraudTrail();
      break;

    default:
      return;
  }

  if (html) showSub(html);
}

/* ===================== EVENT DELEGATION ===================== */

breadcrumbSub?.addEventListener("click", (e) => {
  const viewEl = e.target.closest("[data-view]");
  const fraudRootEl = e.target.closest("[data-fraud-root]");

  // Normal view navigation
  if (viewEl) {
    showView(viewEl.dataset.view);
    return;
  }

  // Fraud root → ALWAYS reset to overview
  if (fraudRootEl) {
    showView("view-fraud");
    showFraudSubView("overview");
  }
});

/* ===================== INIT ===================== */

function initBreadcrumb() {
  const storedView = sessionStorage.getItem(STORE_CURRENT_VIEW);
  if (storedView) {
    updateBreadcrumb(storedView);
  }

  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId) {
      updateBreadcrumb(e.detail.viewId);
    }
  });

  document.addEventListener("fraud:subview", () => {
    updateBreadcrumb("view-fraud");
  });
}

/* ===================== EXPORTS ===================== */

export { initBreadcrumb, updateBreadcrumb };
