/* ============================================================================
   FIN-GUARD GLOBAL STATE
   - Centralized app context (NO DOM, NO navigation)
   - Session keys (persist across refresh)
   - Runtime refs (socket, intervals, charts)
============================================================================ */

/* ===================== SESSION STORAGE KEYS ===================== */

// View
export const STORE_CURRENT_VIEW = "fg_current_view";

// Pagination
export const STORE_PORTFOLIO_PAGE = "fg_portfolio_page";
export const STORE_HOLDINGS_PAGE = "fg_holdings_page";
export const STORE_TRANSACTIONS_PAGE = "fg_transactions_page";
export const STORE_WATCHLIST_PAGE = "fg_watchlist_page"; // ✅ FIX

// Active portfolio
export const STORE_ACTIVE_PORTFOLIO_ID = "fg_active_portfolio_id";
export const STORE_ACTIVE_PORTFOLIO_NAME = "fg_active_portfolio_name";

// Active holding
export const STORE_ACTIVE_HOLDING_ID = "fg_active_holding_id";
export const STORE_ACTIVE_HOLDING_SYMBOL = "fg_active_holding_symbol";

// Fraud
export const STORE_FRAUD_SUBVIEW = "fg_fraud_subview";

/* ===================== RUNTIME STATE ===================== */

// Socket
let socket = null;

// Intervals
let holdingsInterval = null;
let marketInterval = null;
let alertsInterval = null;

// Charts
let portfolioHistoryChart = null;
let portfolioAllocationChart = null;
let fraudScoreChart = null;
let geoRiskChart = null;
let gold7DayChart = null;
let marketMiniChart = null;

/* ===================== SOCKET ===================== */

export function setSocket(io) {
  socket = io;
}

export function getSocket() {
  return socket;
}

/* ===================== ACTIVE PORTFOLIO ===================== */

export function setActivePortfolio(id, name = null) {
  if (id != null) {
    sessionStorage.setItem(STORE_ACTIVE_PORTFOLIO_ID, String(id));
  }
  if (name != null) {
    sessionStorage.setItem(STORE_ACTIVE_PORTFOLIO_NAME, String(name));
  }
}

export function clearActivePortfolio() {
  sessionStorage.removeItem(STORE_ACTIVE_PORTFOLIO_ID);
  sessionStorage.removeItem(STORE_ACTIVE_PORTFOLIO_NAME);
  clearActiveHolding();
}

export function getActivePortfolioId() {
  return sessionStorage.getItem(STORE_ACTIVE_PORTFOLIO_ID);
}

export function getActivePortfolioName() {
  return sessionStorage.getItem(STORE_ACTIVE_PORTFOLIO_NAME);
}

/* ===================== ACTIVE HOLDING ===================== */

export function setActiveHolding(id, symbol = null) {
  if (id != null) {
    sessionStorage.setItem(STORE_ACTIVE_HOLDING_ID, String(id));
  }
  if (symbol != null) {
    sessionStorage.setItem(STORE_ACTIVE_HOLDING_SYMBOL, String(symbol));
  }
}

export function clearActiveHolding() {
  sessionStorage.removeItem(STORE_ACTIVE_HOLDING_ID);
  sessionStorage.removeItem(STORE_ACTIVE_HOLDING_SYMBOL);
}

export function getActiveHoldingId() {
  return sessionStorage.getItem(STORE_ACTIVE_HOLDING_ID);
}

export function getActiveHoldingSymbol() {
  return sessionStorage.getItem(STORE_ACTIVE_HOLDING_SYMBOL);
}

/* ===================== FRAUD SUBVIEW ===================== */

export function setFraudSubview(type = "overview") {
  sessionStorage.setItem(STORE_FRAUD_SUBVIEW, String(type));
}

export function getFraudSubview() {
  return sessionStorage.getItem(STORE_FRAUD_SUBVIEW) || "overview";
}

export function clearFraudSubview() {
  sessionStorage.removeItem(STORE_FRAUD_SUBVIEW);
}

/* ===================== INTERVAL HELPERS ===================== */

export function clearIntervals() {
  if (holdingsInterval) clearInterval(holdingsInterval);
  if (marketInterval) clearInterval(marketInterval);
  if (alertsInterval) clearInterval(alertsInterval);

  holdingsInterval = null;
  marketInterval = null;
  alertsInterval = null;
}

/* ===================== CHART HELPERS ===================== */

export function destroyChart(chart) {
  if (chart && typeof chart.destroy === "function") {
    chart.destroy();
  }
}

/* ===================== RUNTIME REFS (by reference) ===================== */

export {
  holdingsInterval,
  marketInterval,
  alertsInterval,

  portfolioHistoryChart,
  portfolioAllocationChart,
  fraudScoreChart,
  geoRiskChart,
  gold7DayChart,
  marketMiniChart,
};
