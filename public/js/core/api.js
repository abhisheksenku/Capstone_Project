/* ============================================================================
   FIN-GUARD API LAYER
   Centralized Axios wrappers for all backend calls
============================================================================ */

const axios = window.axios;
import { getToken } from "./auth.js";


/* ===================== AXIOS INSTANCE ===================== */

const api = axios.create({
  baseURL: window.location.origin,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===================== REQUEST INTERCEPTOR ===================== */

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ===================== RESPONSE INTERCEPTOR ===================== */

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ============================================================================
   PROFILE
============================================================================ */
function api_getUserProfile() {
  return api.get("/api/user/fetch/profile");
}

/* ============================================================================
   DASHBOARD
============================================================================ */

function api_getDashboardSummary() {
  return api.get("/api/user/dashboard/metrics");
}

function api_getDashboardHoldings() {
  return api.get("/api/user/dashboard/holdings");
}

/* ============================================================================
   PORTFOLIOS
============================================================================ */

function api_getPortfolios(page = 1) {
  return api.get(`/api/user/portfolio/list?page=${page}`);
}

function api_createPortfolio(payload) {
  return api.post("/api/user/portfolio/create", payload);
}

function api_deletePortfolio(portfolioId) {
  return api.delete(`/api/user/delete/portfolio/${portfolioId}`);
}

/* ============================================================================
   HOLDINGS
============================================================================ */
function api_getHoldings(portfolioId, page = 1) {
  return api.get(`/api/user/portfolio/holdings/${portfolioId}?page=${page}`);
}

function api_createHolding(payload) {
  return api.post("/api/user/portfolio/holdings/add", payload);
}


function api_deleteHolding(holdingId) {
  return api.delete(`/api/user/delete/holding/${holdingId}`);
}

/* ============================================================================
   TRANSACTIONS
============================================================================ */

function api_getTransactions(holdingId, page = 1) {
  return api.get(
    `/api/user/portfolio/holdings/${holdingId}/transactions?page=${page}`
  );
}

function api_addTransaction(payload) {
  return api.post("/api/user/portfolio/transactions/add", payload);
}


/* ============================================================================
   MARKET
============================================================================ */

function api_searchMarket(query) {
  return api.get(`/api/user/market/search/${query}`);
}

function api_getMarketQuote(symbol) {
  return api.get(`/api/user/market/quote/${symbol}`);
}

function api_getMarketHeatmap() {
  return api.get("/api/user/market/heatmap");
}

function api_getTrendingStocks() {
  return api.get("/api/user/market/trending");
}
function api_getMarketHistory(symbol) {
  return api.get(`/api/user/market/history/${symbol}`);
}

/* ============================================================================
   WATCHLIST
============================================================================ */

function api_getWatchlist(page = 1) {
  return api.get(`/api/user/watchlist/list?page=${page}`);
}

function api_addToWatchlist(symbol) {
  return api.post("/api/user/watchlist/add", { symbol });
}

function api_removeFromWatchlist(symbol) {
  return api.delete(`/api/user/watchlist/remove/${symbol}`);
}


/* ============================================================================
   FRAUD ANALYTICS
============================================================================ */

function api_getFraudKPIs() {
  return api.get("/api/fraud/stats");
}

function api_getFraudHistory() {
  return api.get("/api/fraud/history");
}

function api_getFraudCases(page = 1) {
  return api.get(`/api/fraud/cases?page=${page}`);
}

function api_testFraudScore(payload) {
  return api.post("/api/fraud/score", payload);
}

/* ============================================================================
   ALERTS
============================================================================ */

function api_getAlerts(page = 1) {
  return api.get(`/api/user/alerts?page=${page}`);
}

function api_markAllAlertsRead() {
  return api.patch("/api/user/alerts/resolve-all");
}

/* ============================================================================
   PREMIUM
============================================================================ */

function api_checkPremiumStatus() {
  return api.get("/api/premium/status");
}

function api_createPremiumOrder() {
  return api.post("/api/premium/create-order");
}

function api_verifyPremiumPayment(orderId) {
  return api.get(`/api/premium/payment-status?order_id=${orderId}`);
}


function api_getGoldPrices() {
  return api.get("/api/premium/gold");
}

/* ============================================================================
   EXPORTS
============================================================================ */
export {
  api_getUserProfile,
  // Dashboard
  api_getDashboardSummary,
  api_getDashboardHoldings,

  // Portfolios
  api_getPortfolios,
  api_createPortfolio,
  api_deletePortfolio,

  // Holdings
  api_getHoldings,
  api_createHolding,
  api_deleteHolding,

  // Transactions
  api_getTransactions,
  api_addTransaction,

  // Market
  api_searchMarket,
  api_getMarketQuote,
  api_getMarketHeatmap,
  api_getTrendingStocks,
  api_getMarketHistory,

  // Watchlist
  api_getWatchlist,
  api_addToWatchlist,
  api_removeFromWatchlist,

  // Fraud
  api_getFraudKPIs,
  api_getFraudHistory,
  api_getFraudCases,
  api_testFraudScore,

  // Alerts
  api_getAlerts,
  api_markAllAlertsRead,

  // Premium
  api_checkPremiumStatus,
  api_createPremiumOrder,
  api_verifyPremiumPayment,
  api_getGoldPrices,
};
