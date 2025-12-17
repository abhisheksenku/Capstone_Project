/* ============================================================================
   FIN-GUARD GLOBAL STATE
   Centralized runtime (in-memory) + session storage keys
   NOTE:
   - Session keys → persisted via sessionStorage
   - Runtime state → reset on refresh
============================================================================ */

/* ===================== SESSION STORAGE KEYS ===================== */

const STORE_CURRENT_VIEW = "fg_current_view";
const STORE_PORTFOLIO_PAGE = "fg_portfolio_page";
const STORE_HOLDINGS_PAGE = "fg_holdings_page";
const STORE_WATCHLIST_PAGE = "fg_watchlist_page";
const STORE_TRENDING_PAGE = "fg_trending_page";
const STORE_ALERTS_PAGE = "fg_alerts_page";

/* ===================== RUNTIME STATE (IN-MEMORY) ===================== */

// Socket.IO instance (single global)
let socket = null;

// Intervals / timers
let holdingsInterval = null;
let marketInterval = null;
let alertsInterval = null;

// Chart.js instances
let portfolioHistoryChart = null;
let portfolioAllocationChart = null;
let fraudScoreChart = null;
let geoRiskChart = null;
let gold7DayChart = null;
let marketMiniChart = null;

// Active selections
let activePortfolioId = null;
let activeHoldingId = null;
let activeSymbol = null;

/* ===================== SOCKET ACCESSORS ===================== */

/**
 * Store socket instance (called once from core/socket.js)
 */
function setSocket(io) {
  socket = io;
}

/**
 * Get socket instance (used by modules that emit events)
 */
function getSocket() {
  return socket;
}

/* ===================== INTERVAL HELPERS ===================== */

function clearIntervals() {
  if (holdingsInterval) {
    clearInterval(holdingsInterval);
    holdingsInterval = null;
  }

  if (marketInterval) {
    clearInterval(marketInterval);
    marketInterval = null;
  }

  if (alertsInterval) {
    clearInterval(alertsInterval);
    alertsInterval = null;
  }
}

/* ===================== CHART HELPERS ===================== */

function destroyChart(chart) {
  if (chart && typeof chart.destroy === "function") {
    chart.destroy();
  }
}

/* ===================== EXPORTS ===================== */

export {
  /* ---- Session keys ---- */
  STORE_CURRENT_VIEW,
  STORE_PORTFOLIO_PAGE,
  STORE_HOLDINGS_PAGE,
  STORE_WATCHLIST_PAGE,
  STORE_TRENDING_PAGE,
  STORE_ALERTS_PAGE,

  /* ---- Runtime state (read-only usage) ---- */
  socket,
  holdingsInterval,
  marketInterval,
  alertsInterval,

  portfolioHistoryChart,
  portfolioAllocationChart,
  fraudScoreChart,
  geoRiskChart,
  gold7DayChart,
  marketMiniChart,

  activePortfolioId,
  activeHoldingId,
  activeSymbol,

  /* ---- Mutators / helpers ---- */
  setSocket,
  getSocket,
  clearIntervals,
  destroyChart,
};
