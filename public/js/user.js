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

import {
  initNavigation,
  restoreLastView,
  showView,
} from "./layout/navigation.js";

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

/* ===================== FRAUD (ES MODULES) ===================== */

import { initFraudKPIs } from "./fraud/fraud-kpi.js";
import { initFraudHistory } from "./fraud/fraud-history.js";
import { initFraudCases } from "./fraud/fraud-cases.js";
import { initFraudMap } from "./fraud/fraud-map.js";
import { initFraudModals } from "./fraud/fraud-modal.js";
import { initFraudScoreDistribution } from "./fraud/fraudScoreDistribution.js";

/* ===================== ALERTS ===================== */

import { initAlerts } from "./alerts/alerts.js";

/* ===================== PREMIUM ===================== */

import { initPremium } from "./premium/premium.js";

/* ============================================================================
   INIT APP
============================================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    /* ---------------- AUTH ---------------- */
    if (!requireAuth()) return;

    /* ---------------- SOCKET ---------------- */
    initSocket();

    /* ---------------- PROFILE ---------------- */
    await loadUserProfile();
    initProfileMenu();

    /* ---------------- NAVIGATION ---------------- */
    initNavigation();
    initBreadcrumb();
    initTabs();

    /* ---------------- REGISTER VIEW LISTENERS ---------------- */
    initPortfolios();
    initHoldings();
    initTransactions();

    initMarket();
    initHeatmap();
    initWatchlist();
    initTrending();

    /* ---------------- FRAUD MODULES ---------------- */
    initFraudKPIs();
    initFraudHistory();
    initFraudCases();
    initFraudMap();
    initFraudModals();
    initFraudScoreDistribution();

    initAlerts();
    initPremium();

    /* ---------------- DASHBOARD ---------------- */
    document.addEventListener("view:change", async (e) => {
      if (e.detail?.viewId === "view-overview") {
        initDashboardCharts();
        await loadDashboard();
      }
    });

    /* ===================== FRAUD SUB-VIEW BUTTONS ===================== */

    const btnViewFraudAnalysis = document.getElementById(
      "btnViewFraudAnalysis"
    );
    const btnViewFraudCases = document.getElementById("btnViewFraudCases");

    if (btnViewFraudAnalysis) {
      btnViewFraudAnalysis.addEventListener("click", () => {
        document.dispatchEvent(
          new CustomEvent("view:change", {
            detail: { viewId: "view-fraud-analysis" },
          })
        );
      });
    }

    if (btnViewFraudCases) {
      btnViewFraudCases.addEventListener("click", () => {
        document.dispatchEvent(
          new CustomEvent("view:change", {
            detail: { viewId: "view-fraud-cases" },
          })
        );
      });
    }

    /* ---------------- RESTORE VIEW ---------------- */
    const restored = restoreLastView();
    if (!restored) {
      showView("view-overview");
    }

    console.info("Fin-Guard User Dashboard initialized successfully");
  } catch (err) {
    console.error("User dashboard initialization failed:", err);
  }
});
