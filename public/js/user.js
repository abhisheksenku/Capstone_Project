/* ============================================================================
   FIN-GUARD USER DASHBOARD – MAIN ENTRY FILE
   Bootstraps all frontend modules (ES Module)
============================================================================ */

/* ===================== CORE ===================== */

import { requireAuth } from "./core/auth.js";
import { initSocket } from "./core/socket.js";

/* ===================== SETTINGS ===================== */

import "./settings/profile.js";

/* ===================== LAYOUT ===================== */

import { initNavigation } from "./layout/navigation.js";
import { initBreadcrumb } from "./layout/breadcrumb.js";
import { initProfileMenu, loadUserProfile } from "./layout/profile.js";
import { initTabs } from "./layout/tabs.js";

/* ===================== DASHBOARD ===================== */

import { loadDashboard } from "./dashboard/dashboard.js";
import { initDashboardCharts } from "./dashboard/charts.js";

/* ===================== PORTFOLIO ===================== */

import { initPortfolios } from "./portfolio/portfolios.js";
import { initHoldings } from "./portfolio/holdings.js";
import { initTransactions } from "./portfolio/transactions.js";

/* ===================== MARKET ===================== */

import { initMarket } from "./market/market.js";
import { initHeatmap } from "./market/heatmap.js";
import { initWatchlist } from "./market/watchlist.js";
import { initTrending } from "./market/trending.js";

/* ===================== FRAUD ===================== */

import { initFraudKPIs } from "./fraud/fraud-kpi.js";
import { initFraudHistory } from "./fraud/fraud-history.js";
import { initFraudCases } from "./fraud/fraud-cases.js";
import { initFraudMap } from "./fraud/fraud-map.js";
import { initFraudModals } from "./fraud/fraud-modal.js";
import { initFraudScoreDistribution } from "./fraud/fraudScoreDistribution.js";
import { showFraudSubView } from "./fraud/fraudSubView.js";
import { showView } from "./layout/navigation.js";

/* ===================== ALERTS ===================== */

import { initAlerts } from "./alerts/alerts.js";

/* ===================== PREMIUM ===================== */

import { initPremium } from "./premium/premium.js";

/* ============================================================================
   INIT APP
============================================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (!requireAuth()) return;

    initSocket();

    await loadUserProfile();
    initProfileMenu();

    initNavigation();
    initBreadcrumb();
    initTabs();

    // register modules
    initPortfolios();
    initHoldings();
    initTransactions();

    initMarket();
    initHeatmap();
    initWatchlist();
    initTrending();

    initFraudKPIs();
    initFraudHistory();
    initFraudCases();
    initFraudMap();
    initFraudModals();
    initFraudScoreDistribution();

    initAlerts();
    initPremium();

    // Dashboard load when overview opens
    document.addEventListener("view:change", async (e) => {
      if (e.detail?.viewId === "view-overview") {
        initDashboardCharts();
        await loadDashboard();
      }
    });

    // Fraud subview buttons (REAL behavior)
    document.getElementById("btnViewFraudAnalysis")?.addEventListener("click", () => {
      showView("view-fraud");
      showFraudSubView("analysis");
    });

    document.getElementById("btnViewFraudCases")?.addEventListener("click", () => {
      showView("view-fraud");
      showFraudSubView("cases");
    });

    console.info("Fin-Guard User Dashboard initialized successfully");
  } catch (err) {
    console.error("User dashboard initialization failed:", err);
  }
});
