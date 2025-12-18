/* ============================================================================
   FIN-GUARD USER DASHBOARD – INIT
   Entry point for frontend bootstrapping
============================================================================ */

/* ===================== CORE ===================== */

import { requireAuth } from "./auth.js";
import { initSocket } from "./socket.js";
import { showToast } from "./helpers.js";

/* ===================== LAYOUT ===================== */

import {
  initNavigation,
  restoreLastView,
  showView,
} from "../layout/navigation.js";

import { initBreadcrumb } from "../layout/breadcrumb.js";
import { initTabs } from "../layout/tabs.js";
import {
  initProfileMenu,
  loadUserProfile,
} from "../layout/profile.js";

/* ===================== DASHBOARD ===================== */

import { loadDashboard } from "../dashboard/dashboard.js";
import { initDashboardCharts } from "../dashboard/charts.js";

/* ===================== PORTFOLIO ===================== */

import { initPortfolios } from "../portfolio/portfolios.js";
import { initHoldings } from "../portfolio/holdings.js";
import { initTransactions } from "../portfolio/transactions.js";

/* ===================== MARKET ===================== */

import { initMarket } from "../market/market.js";
import { initHeatmap } from "../market/heatmap.js";
import { initWatchlist } from "../market/watchlist.js";
import { initTrending } from "../market/trending.js";

/* ===================== FRAUD ===================== */

import { initFraudKPIs } from "../fraud/fraud-kpi.js";
import { initFraudHistory } from "../fraud/fraud-history.js";
import { initFraudCases } from "../fraud/fraud-cases.js";
import { initFraudMap } from "../fraud/fraud-map.js";
import { initFraudModals } from "../fraud/fraud-modal.js";

/* ===================== ALERTS ===================== */

import { initAlerts } from "../alerts/alerts.js";

/* ===================== PREMIUM ===================== */

import { initPremium } from "../premium/premium.js";
import { initGold } from "../premium/gold.js";

/* ============================================================================
   DOM READY
============================================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    /* =====================================================
       1. AUTH CHECK
    ===================================================== */
    if (!requireAuth()) return;

    /* =====================================================
       2. USER PROFILE (HEADER)
    ===================================================== */
    await loadUserProfile();
    initProfileMenu();

    /* =====================================================
       3. NAVIGATION + UI
    ===================================================== */
    initNavigation();
    initBreadcrumb();
    initTabs();

    /* =====================================================
       4. SOCKET
    ===================================================== */
    initSocket();

    /* =====================================================
       5. MODULE INITIALIZATION
       (REGISTER ALL view:change LISTENERS)
    ===================================================== */
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

    initAlerts();
    initPremium();
    initGold();

    /* =====================================================
       6. DASHBOARD VIEW HANDLER
       ⚠️ Charts FIRST, data SECOND
    ===================================================== */
    document.addEventListener("view:change", async (e) => {
      if (e.detail?.viewId === "view-dashboard") {
        initDashboardCharts();   // ✅ init once per view
        await loadDashboard();   // ✅ then load data
      }
    });

    /* =====================================================
       7. RESTORE LAST VIEW (MUST BE LAST)
       → triggers view:change
    ===================================================== */
    const restored = restoreLastView();

    if (!restored) {
      showView("view-dashboard");
    }

    /* =====================================================
       8. READY
    ===================================================== */
    console.info("FinGuard User Dashboard initialized");
  } catch (err) {
    console.error("Dashboard initialization failed:", err);
    showToast("Failed to initialize dashboard", "error");
  }
});
