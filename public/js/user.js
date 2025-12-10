/* ============================================================================
   FIN-GUARD USER DASHBOARD SCRIPT
   Clean architecture • Fully synced with user.html • Backend-compatible
============================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     01. CONFIGURATION + GLOBAL STATE
     ========================================================================== */

  const BASE_URL = window.location.origin;
  const token = sessionStorage.getItem("token");

  function requireAuth() {
    if (!token) {
      window.location.href = "/login";
      return false;
    }
    return true;
  }

  // Session keys
  const STORE_CURRENT_VIEW = "fg_current_view";
  const STORE_PORTFOLIO_PAGE = "fg_portfolio_page";

  // Runtime state
  let websocket = null;
  let holdingsInterval = null;
  let fraudScoreChart = null;
  let geoRiskChart = null;

  /* ==========================================================================
     02. GENERIC SAFE HELPERS
     ========================================================================== */

  function apiError(err) {
    const msg = err?.response?.data?.message || err?.message || "API Error";
    console.error(msg);
    showNotification(msg, true);
  }

  function showNotification(message, isError = false) {
    const box = document.getElementById("toast");
    if (!box) return;

    box.classList.remove("hidden");
    box.textContent = message;
    box.style.backgroundColor = isError ? "#dc2626" : "#2563eb";

    setTimeout(() => {
      box.style.opacity = "0";
      setTimeout(() => {
        box.classList.add("hidden");
        box.style.opacity = "1";
      }, 400);
    }, 2500);
  }

  function showFraudLiveAlert(text) {
    const box = document.getElementById("fraud-live-alert");
    if (!box) return;

    box.innerHTML = text;
    box.classList.remove("hidden");

    setTimeout(() => {
      box.classList.add("hidden");
    }, 5000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatShort(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n;
  }

  /* ==========================================================================
     03. VIEW SYSTEM (Show/Hide + Active Sidebar)
     ========================================================================== */

  const navLinks = document.querySelectorAll(".sidebar-link");
  const pageTitle = document.getElementById("page-title");

  const views = {
    "link-overview": "view-overview",
    "link-portfolios": "view-portfolios",
    "link-portfolio-create": "view-portfolio-create",
    "link-market": "view-market",
    "link-watchlist": "view-watchlist",
    "link-trending": "view-trending",
    "link-fraud": "view-fraud",
    "link-alerts": "view-alerts",
    "link-settings": "view-settings",
    "link-features": "view-features",
  };

  const titles = {
    "link-overview": "Portfolio Overview",
    "link-portfolios": "My Portfolios",
    "link-market": "Market",
    "link-watchlist": "Watchlist",
    "link-trending": "Trending Stocks",
    "link-fraud": "Fraud Analytics",
    "link-alerts": "Alerts",
    "link-settings": "User Profile",
    "link-features": "Premium Features",
  };

  function ui_showView(viewId) {
    document
      .querySelectorAll(".view-section")
      .forEach((v) => v.classList.add("hidden"));
    const v = document.getElementById(viewId);
    if (v) v.classList.remove("hidden");

    // Stop holdings auto-refresh when leaving holdings view
    if (viewId !== "view-holdings" && holdingsInterval) {
      clearInterval(holdingsInterval);
      holdingsInterval = null;
    }
  }
  function ui_setActive(linkId) {
    // remove active state from all links
    navLinks.forEach((l) => l.classList.remove("active"));

    if (!linkId) {
      sessionStorage.removeItem(STORE_CURRENT_VIEW);
    }

    const activeLink = linkId ? document.getElementById(linkId) : null;
    if (activeLink) activeLink.classList.add("active");

    // Auto-open Overview submenu if needed
    const submenu = document.getElementById("overview-submenu");
    const toggle = document.getElementById("link-overview-toggle");

    if (linkId === "link-overview" || linkId === "link-portfolios") {
      submenu?.classList.remove("hidden");
      toggle?.setAttribute("aria-expanded", "true");
    } else {
      submenu?.classList.add("hidden");
      toggle?.setAttribute("aria-expanded", "false");
    }

    // Save active navigation state
    if (linkId) {
      sessionStorage.setItem(STORE_CURRENT_VIEW, linkId);
    }
  }

  /* ==========================================================================
     04. PROFILE LOAD (Header + Settings Page)
     ========================================================================== */

  /* ==========================================================================
     END OF PART 1
     ========================================================================== */
  /* ==========================================================================
     05. NAVIGATION SYSTEM (Desktop + Mobile)
     ========================================================================== */

  // Desktop sidebar navigation
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const linkId = link.id;
      const viewId = views[linkId];

      ui_setActive(linkId);
      ui_showView(viewId);

      pageTitle.textContent = titles[linkId] || "";

      // Special bootstraps per section
      if (linkId === "link-portfolios") {
        const savedPage =
          Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        ui_renderPortfolioList(savedPage);
        updateBreadcrumb("Overview", "Portfolios");
      } else if (linkId === "link-watchlist") {
        ui_renderWatchlist(1);
        updateBreadcrumb("Overview", "Watchlist");
      } else if (linkId === "link-trending") {
        ui_renderTrending();
        updateBreadcrumb("Overview", "Trending");
      } else if (linkId === "link-market") {
        ui_renderHeatmap();
        updateBreadcrumb("Overview", "Market");
      } else if (linkId === "link-fraud") {
        ui_renderFraudStats();
        ui_renderFraudDistribution();
        ui_renderGeoHeatmap();

        // Show only the overview section
        document
          .getElementById("fraud-overview-section")
          .classList.remove("hidden");
        document
          .getElementById("fraud-analysis-section")
          .classList.add("hidden");
        document.getElementById("fraud-cases-section").classList.add("hidden");

        // Reset Fraud breadcrumb
        bcDivider3.classList.add("hidden");
        bcSub.classList.add("hidden");
        bcSub.textContent = "";
      } else {
        updateBreadcrumb(null);
      }
    });
  });

  /* --------------------------------------------------------------------------
     OVERVIEW SUBMENU LOGIC
  -------------------------------------------------------------------------- */

  const overviewToggle = document.getElementById("link-overview-toggle");
  const overviewSubmenu = document.getElementById("overview-submenu");

  if (overviewToggle) {
    overviewToggle.addEventListener("click", (e) => {
      e.preventDefault();

      const expanded = overviewToggle.getAttribute("aria-expanded") === "true";
      overviewToggle.setAttribute("aria-expanded", !expanded);
      overviewSubmenu.classList.toggle("hidden", expanded);

      if (!expanded) {
        ui_setActive("link-overview");
        ui_showView("view-overview");
        pageTitle.textContent = "Portfolio Overview";
        updateBreadcrumb(null);
      }
    });
  }

  // Clicking "Portfolios" inside submenu
  const submenuPortfolioLink = document.getElementById("link-portfolios");
  if (submenuPortfolioLink) {
    submenuPortfolioLink.addEventListener("click", (e) => {
      e.preventDefault();
      ui_setActive("link-portfolios");
      ui_showView("view-portfolios");
      pageTitle.textContent = "My Portfolios";
      updateBreadcrumb("Overview", "Portfolios");
      ui_renderPortfolioList(1);
    });
  }

  /* --------------------------------------------------------------------------
     MOBILE NAVIGATION
  -------------------------------------------------------------------------- */

  const mobileMenuBtn = document.getElementById("mobile-mainmenu-btn");
  const mobileMgmtBtn = document.getElementById("mobile-management-btn");
  const mobileMenuPanel = document.getElementById("mobile-mainmenu-panel");
  const mobileMgmtPanel = document.getElementById("mobile-management-panel");
  const mobileOverlay = document.getElementById("mobile-overlay");

  function mobile_closeAll() {
    mobileMenuPanel?.classList.add("hidden");
    mobileMgmtPanel?.classList.add("hidden");
    mobileOverlay?.classList.add("hidden");
  }

  function mobile_open(panel) {
    mobile_closeAll();
    panel?.classList.remove("hidden");
    mobileOverlay?.classList.remove("hidden");
  }

  mobileMenuBtn?.addEventListener("click", () => mobile_open(mobileMenuPanel));
  mobileMgmtBtn?.addEventListener("click", () => mobile_open(mobileMgmtPanel));
  mobileOverlay?.addEventListener("click", mobile_closeAll);

  // Mobile submenu
  const mobileOverviewToggle = document.getElementById(
    "mobile-overview-toggle"
  );
  const mobileOverviewSub = document.getElementById("mobile-overview-submenu");

  if (mobileOverviewToggle) {
    mobileOverviewToggle.addEventListener("click", () => {
      const expanded =
        mobileOverviewToggle.getAttribute("aria-expanded") === "true";
      mobileOverviewToggle.setAttribute("aria-expanded", !expanded);
      mobileOverviewSub.classList.toggle("hidden", expanded);
    });
  }

  // Mobile links → same handlers as desktop
  document.querySelectorAll("[data-target-link]").forEach((node) => {
    node.addEventListener("click", (e) => {
      e.preventDefault();

      const linkId = node.dataset.targetLink;
      const viewId = views[linkId];

      ui_setActive(linkId);
      ui_showView(viewId);
      pageTitle.textContent = titles[linkId] || "";

      mobile_closeAll();

      // Section boots
      if (linkId === "link-portfolios") {
        ui_renderPortfolioList(1);
        updateBreadcrumb("Overview", "Portfolios");
      } else if (linkId === "link-watchlist") {
        ui_renderWatchlist(1);
        updateBreadcrumb("Overview", "Watchlist");
      } else if (linkId === "link-trending") {
        ui_renderTrending();
        updateBreadcrumb("Overview", "Trending");
      } else if (linkId === "link-market") {
        ui_renderHeatmap();
        updateBreadcrumb("Overview", "Market");
      } else if (linkId === "link-fraud") {
        ui_renderFraudStats();
        ui_renderFraudDistribution();
        ui_renderGeoHeatmap();

        // Show only overview section
        document
          .getElementById("fraud-overview-section")
          .classList.remove("hidden");
        document
          .getElementById("fraud-analysis-section")
          .classList.add("hidden");
        document.getElementById("fraud-cases-section").classList.add("hidden");

        // Reset Fraud breadcrumb
        bcDivider3.classList.add("hidden");
        bcSub.classList.add("hidden");
        bcSub.textContent = "";
      } else {
        updateBreadcrumb(null);
      }
    });
  });

  /* ==========================================================================
     06. BREADCRUMB SYSTEM
     ========================================================================== */

  const crumbRoot = document.getElementById("breadcrumb-overview");
  const crumbDivider = document.getElementById("breadcrumb-divider");
  const crumbSub = document.getElementById("breadcrumb-sub");

  function updateBreadcrumb(main = null, sub = null) {
    if (!crumbRoot || !crumbDivider || !crumbSub) return;

    if (!main) {
      crumbRoot.style.display = "none";
      crumbDivider.classList.add("hidden");
      crumbSub.classList.add("hidden");
      return;
    }

    crumbRoot.style.display = "inline";
    crumbDivider.classList.toggle("hidden", !sub);
    crumbSub.classList.toggle("hidden", !sub);
    crumbSub.textContent = sub || "";
  }

  // breadcrumb click → go back to overview
  if (crumbRoot) {
    crumbRoot.addEventListener("click", (e) => {
      e.preventDefault();
      ui_setActive("link-overview");
      ui_showView("view-overview");
      pageTitle.textContent = "Portfolio Overview";
      updateBreadcrumb(null);
    });
  }

  /* ==========================================================================
     END OF PART 2
     ========================================================================== */
  /* ==========================================================================
     07. PROFILE DROPDOWN (Header Menu)
     ========================================================================== */

  const profileToggle = document.getElementById("profile-menu-toggle");

  // Dropdown container (injected once)
  const profileDropdown = document.createElement("div");
  profileDropdown.id = "profileDropdown";
  profileDropdown.className =
    "hidden absolute top-16 right-4 w-56 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-50";

  profileDropdown.innerHTML = `
    <div class="font-semibold text-slate-800 mb-1">Loading…</div>
    <div class="text-sm text-slate-500">Fetching user</div>
  `;

  document.body.appendChild(profileDropdown);

  // Toggle dropdown
  profileToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("hidden");
  });

  // Auto-hide when user clicks outside
  document.addEventListener("click", () => {
    profileDropdown.classList.add("hidden");
  });

  // Inject user content into dropdown after profile is fetched
  async function updateProfileDropdown(user) {
    if (!profileDropdown) return;

    profileDropdown.innerHTML = `
      <div class="font-semibold text-slate-800">${user.name}</div>
      <div class="text-sm text-slate-500 mb-3">${user.email}</div>

      <button id="profileViewBtn"
        class="w-full bg-blue-600 text-white py-1.5 rounded-md text-sm hover:bg-blue-700 transition">
        View Profile
      </button>
    `;

    const btn = document.getElementById("profileViewBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        ui_setActive("link-settings");
        ui_showView("view-settings");
        pageTitle.textContent = titles["link-settings"];
        profileDropdown.classList.add("hidden");
        updateBreadcrumb(null);
      });
    }
  }

  /* ==========================================================================
     08. TABS (Overview Page)
     ========================================================================== */

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // visually activate selected btn
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // show relevant panel
      tabPanels.forEach((p) => p.classList.add("hidden"));
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.remove("hidden");
    });
  });

  /* ==========================================================================
     09. PREMIUM BADGE & UNLOCK SYSTEM
     ========================================================================== */

  const premiumBlock = document.getElementById("premium-block"); // locked content
  const goldPrices = document.getElementById("gold-prices"); // unlocked premium
  const premiumBadge = document.getElementById("premium-badge"); // header badge
  const premiumBtn = document.getElementById("premium-btn"); // unlock button
  const premiumFeaturesLink = document.getElementById("link-features");

  /* ==========================================================================
     10. TOAST AUTO-HIDE (Basic Notifications)
     ========================================================================== */

  const toast = document.getElementById("toast");
  if (toast) {
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.style.display = "none";
      }, 400);
    }, 4500);
  }

  /* ==========================================================================
     11. PROFILE LOAD (Header + Settings UI)
     ========================================================================== */

  /* ==========================================================================
     END OF PART 3
     ========================================================================== */
  /* ==========================================================================
     12. REAL-TIME ENGINE (WebSockets)
     ========================================================================== */

  /* ==========================================================================
     END OF PART 4
     ========================================================================== */
  /* ==========================================================================
     13. API CLIENT — CLEAN BACKEND WRAPPERS
     ========================================================================== */

  // Common request config
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* --------------------------------------------------------------------------
     USER PROFILE
  -------------------------------------------------------------------------- */

  async function api_getProfile() {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/fetch/profile`,
        authHeaders
      );
      return res.data.user;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  /* --------------------------------------------------------------------------
     PORTFOLIOS
  -------------------------------------------------------------------------- */

  async function api_getPortfolios(page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/portfolio/list?page=${page}&limit=5`,
        authHeaders
      );
      return res.data; // { portfolios, pagination }
    } catch (err) {
      apiError(err);
      return { portfolios: [], pagination: {} };
    }
  }

  async function api_createPortfolio(payload) {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/user/portfolio/create`,
        payload,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      throw err;
    }
  }
  async function api_deletePortfolio(id) {
    return axios.delete(`/api/user/delete/portfolio/${id}`, authHeaders);
  }

  /* --------------------------------------------------------------------------
     HOLDINGS
  -------------------------------------------------------------------------- */

  async function api_getHoldings(portfolioId, page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/portfolio/holdings/${portfolioId}?page=${page}&limit=5`,
        authHeaders
      );
      return res.data; // { holdings, pagination }
    } catch (err) {
      apiError(err);
      return { holdings: [], pagination: {} };
    }
  }

  async function api_addHolding(payload) {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/user/portfolio/holdings/add`,
        payload,
        authHeaders
      );
      return res.data.holding;
    } catch (err) {
      apiError(err);
      throw err;
    }
  }
  async function api_deleteHolding(id) {
    return axios.delete(`/api/user/delete/holding/${id}`, authHeaders);
  }

  /* --------------------------------------------------------------------------
     TRANSACTIONS
  -------------------------------------------------------------------------- */

  async function api_getHoldingTransactions(holdingId, page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/portfolio/holdings/${holdingId}/transactions?page=${page}&limit=5`,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return { transactions: [], pagination: {} };
    }
  }

  async function api_addTransaction(payload) {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/user/portfolio/transactions/add`,
        payload,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      throw err;
    }
  }
  async function api_deleteTransaction(id) {
    return axios.delete(`/api/user/delete/transaction/${id}`, authHeaders);
  }

  /* --------------------------------------------------------------------------
     WATCHLIST
  -------------------------------------------------------------------------- */

  async function api_addWatchlist(symbol) {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/user/watchlist/add`,
        { symbol },
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  async function api_getWatchlist(page = 1, limit = 10) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/watchlist/list?page=${page}&limit=${limit}`,
        authHeaders
      );
      return res.data; // { items, pagination }
    } catch (err) {
      apiError(err);
      return { items: [], pagination: {} };
    }
  }

  async function api_removeWatchlist(symbol) {
    try {
      const res = await axios.delete(
        `${BASE_URL}/api/user/watchlist/remove/${symbol}`,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  /* --------------------------------------------------------------------------
     MARKET DATA
  -------------------------------------------------------------------------- */

  async function api_getMarketQuote(symbol) {
    try {
      const r = await axios.get(
        `${BASE_URL}/api/user/market/quote/${symbol}`,
        authHeaders
      );
      return r.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  async function api_getMarketHistory(symbol) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/market/history/${symbol}`,
        authHeaders
      );

      if (!Array.isArray(res.data)) return [];

      return res.data; // already [{time, price}]
    } catch (err) {
      apiError(err);
      return [];
    }
  }

  async function api_getHeatmap() {
    try {
      const r = await axios.get(
        `${BASE_URL}/api/user/market/heatmap`,
        authHeaders
      );
      return r.data.items || [];
    } catch (err) {
      apiError(err);
      return [];
    }
  }

  async function api_getTrending() {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/market/trending`,
        authHeaders
      );
      return res.data.items || [];
    } catch (err) {
      apiError(err);
      return [];
    }
  }

  async function api_getNews(symbol) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/market/news/${symbol}`,
        authHeaders
      );
      return { headlines: res.data.headlines || [] };
    } catch (err) {
      apiError(err);
      return { headlines: [] };
    }
  }

  /* --------------------------------------------------------------------------
     FRAUD ANALYTICS
  -------------------------------------------------------------------------- */

  async function api_testFraud(payload) {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/fraud/score`,
        payload,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  async function api_getFraudStats() {
    try {
      const res = await axios.get(`${BASE_URL}/api/fraud/stats`, authHeaders);
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }
  async function api_getFraudDetail(txnId) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/fraud/history/${txnId}`,
        authHeaders
      );
      return res.data.detail;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  // async function api_getFraudScores() {
  //   try {
  //     const res = await axios.get(
  //       `${BASE_URL}/api/user/fraud/scores`,
  //       authHeaders
  //     );
  //     return res.data.scores || [];
  //   } catch (err) {
  //     apiError(err);
  //     return [];
  //   }
  // }

  async function api_getGeoRisk() {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/fraud/geo-risk`,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return {};
    }
  }

  async function api_getFraudCases(page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/fraud/cases?page=${page}&limit=10`,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return { cases: [], pagination: {} };
    }
  }
  // ==================== FRAUD HISTORY API ====================
  async function api_getFraudHistory() {
    try {
      const res = await axios.get(`${BASE_URL}/api/fraud/history`, authHeaders);
      return res.data.items || [];
    } catch (err) {
      apiError(err);
      return [];
    }
  }

  /* --------------------------------------------------------------------------
   PREMIUM SUBSCRIPTION API
-------------------------------------------------------------------------- */

  async function api_createPremiumOrder() {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/premium/create-order`,
        {},
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  async function api_getPremiumStatus() {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/premium/status`,
        authHeaders
      );
      return res.data;
    } catch (err) {
      return { isPremium: false };
    }
  }
  /* --------------------------------------------------------------------------
   GOLD MARKET DATA API
-------------------------------------------------------------------------- */
  async function api_getGoldMarketData() {
    try {
      const res = await axios.get(`${BASE_URL}/api/premium/gold`, authHeaders);
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }
  async function api_getGoldHistory() {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/premium/gold/history`,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return [];
    }
  }

  /* ==========================================================================
     END OF PART 5
     ========================================================================== */
  /* ==========================================================================
     14. PORTFOLIOS UI + NAVIGATION
     ========================================================================== */

  // Save portfolio page for persistence
  function savePortfolioPage(page) {
    sessionStorage.setItem(STORE_PORTFOLIO_PAGE, String(page));
  }

  /* --------------------------------------------------------------------------
     RENDER PORTFOLIO LIST
  -------------------------------------------------------------------------- */

  async function ui_renderPortfolioList(page = 1) {
    ui_showView("view-portfolios");
    ui_setActive("link-portfolios");

    const { portfolios, pagination } = await api_getPortfolios(page);

    const list = document.getElementById("portfolio-list");
    const pag = document.getElementById("portfolio-pagination");

    list.innerHTML = "";
    pag.innerHTML = "";

    const currentPage = pagination.page || page || 1;
    savePortfolioPage(currentPage);

    if (!portfolios.length) {
      list.innerHTML = `
      <div class="text-center py-6 text-slate-500">
        No portfolios found. Create one to get started.
      </div>
    `;
      return;
    }

    /* ================================
     RENDER PORTFOLIO CARDS
  ================================= */
    portfolios.forEach((p) => {
      list.innerHTML += `
      <div class="portfolio-card border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition"
           data-id="${p.id}"
           data-name="${escapeHtml(p.name)}">

        <div class="flex justify-between items-center">

          <div>
            <div class="font-bold text-slate-800">${escapeHtml(p.name)}</div>
            <div class="text-sm text-slate-500 mt-1">
              ${escapeHtml(p.description || "No description")}
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="text-blue-600 underline text-sm">
              View Holdings
            </button>

            <button class="delete-portfolio-btn text-red-600 text-sm"
                    data-id="${p.id}">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
    });

    /* ================================
     OPEN HOLDINGS ON CARD CLICK
  ================================= */
    document.querySelectorAll(".portfolio-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const name = card.dataset.name;

        sessionStorage.setItem("fg_current_portfolio_id", id);
        sessionStorage.setItem("fg_current_portfolio_name", name);

        ui_renderHoldings(id, name, 1);
      });
    });

    /* ================================
     DELETE PORTFOLIO HANDLER
  ================================= */
    document.querySelectorAll(".delete-portfolio-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevent card click event

        const id = btn.dataset.id;
        if (!confirm("Delete this portfolio? Only if no holdings exist."))
          return;

        try {
          await api_deletePortfolio(id);

          showNotification("Portfolio deleted successfully!");

          const saved =
            Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
          ui_renderPortfolioList(saved);
        } catch (err) {
          if (err.response && err.response.status === 400) {
            showNotification("Please delete holdings first.", true);
          } else {
            apiError(err);
          }
        }
      });
    });

    /* ================================
     PAGINATION
  ================================= */
    const prev = pagination.prev || null;
    const next = pagination.next || null;
    const totalPages = pagination.totalPages || 1;

    pag.innerHTML = `
    <button data-page="${prev || ""}"
      class="px-4 py-2 border rounded text-sm ${
        !prev ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
      }">← Prev</button>

    <span class="px-4 py-2 text-sm font-medium">
      Page ${currentPage} of ${totalPages}
    </span>

    <button data-page="${next || ""}"
      class="px-4 py-2 border rounded text-sm ${
        !next ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
      }">Next →</button>
  `;

    pag.querySelectorAll("button[data-page]").forEach((btn) => {
      const p = btn.dataset.page;
      if (p)
        btn.addEventListener("click", () => ui_renderPortfolioList(Number(p)));
    });
  }

  /* --------------------------------------------------------------------------
   CREATE PORTFOLIO UI + FORM SUBMISSION
--------------------------------------------------------------------------- */

  const addNewPortfolioBtn = document.getElementById("addNewPortfolioBtn");
  const portfolioCreateForm = document.getElementById("portfolioCreateForm");

  // Open Create Portfolio Page
  if (addNewPortfolioBtn) {
    addNewPortfolioBtn.addEventListener("click", (e) => {
      e.preventDefault();

      portfolioCreateForm?.reset();
      ui_setActive(null);
      ui_showView("view-portfolio-create");

      pageTitle.textContent = "Create Portfolio";
      breadcrumb_update("Overview", "New Portfolio");
    });
  }

  // Create Portfolio (form submit)
  if (portfolioCreateForm) {
    portfolioCreateForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("portfolioName").value.trim();
      const description = document
        .getElementById("portfolioDescription")
        .value.trim();

      if (!name) {
        showNotification("Portfolio name is required", true);
        return;
      }

      await api_createPortfolio({ name, description });

      showNotification("Portfolio created successfully!");

      ui_setActive("link-portfolios");
      ui_showView("view-portfolios");

      ui_renderPortfolioList(1);

      breadcrumb_update("Overview", "Portfolios");
    });
  }
  /* CANCEL CREATE PORTFOLIO */
  const cancelCreatePortfolioBtn = document.getElementById(
    "cancelCreatePortfolioBtn"
  );

  if (cancelCreatePortfolioBtn) {
    cancelCreatePortfolioBtn.addEventListener("click", (e) => {
      e.preventDefault();
      ui_setActive("link-portfolios");
      ui_showView("view-portfolios");
      pageTitle.textContent = "My Portfolios";
      const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
      ui_renderPortfolioList(saved);
    });
  }

  /* ==========================================================================
     15. HOLDINGS UI
     ========================================================================== */

  async function ui_renderHoldings(portfolioId, portfolioName, page = 1) {
    ui_showView("view-holdings");

    sessionStorage.setItem("fg_current_portfolio_id", portfolioId);
    sessionStorage.setItem("fg_current_portfolio_name", portfolioName);

    const title = document.getElementById("holdings-title");
    title.textContent = `Holdings: ${portfolioName}`;

    const { holdings, pagination } = await api_getHoldings(portfolioId, page);

    const list = document.getElementById("holdings-list");
    const pag = document.getElementById("holdings-pagination");

    list.innerHTML = "";
    pag.innerHTML = "";

    if (!holdings.length) {
      list.innerHTML = `
        <div class="text-center py-6 text-slate-500">
          No holdings found in this portfolio.
        </div>
      `;
    } else {
      holdings.forEach((h) => {
        list.innerHTML += `
          <div class="holding-card border border-slate-200 rounded p-3 cursor-pointer hover:bg-slate-50"
               data-id="${h.id}"
               data-symbol="${h.symbol}">

            <div class="flex justify-between items-center">
              <div>
                <div class="font-bold text-slate-800">${h.symbol}</div>
                <div class="text-sm text-slate-600 mt-1">
                  Qty: ${h.quantity} • Avg: ₹${h.avg_price}
                </div>
              </div>

              <button class="watch-btn text-yellow-500 text-xl"
                      data-symbol="${h.symbol}">
                ★
              </button>
              <button class="delete-holding-btn text-red-600 text-sm ml-3"
                      data-id="${h.id}">
                Delete
              </button>

            </div>
          </div>
        `;
      });
      document.querySelectorAll(".delete-holding-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation(); // Prevent opening transactions

          const id = btn.dataset.id;

          if (!confirm("Delete this holding? Only if no transactions exist."))
            return;

          try {
            const pid = sessionStorage.getItem("fg_current_portfolio_id");
            const pname = sessionStorage.getItem("fg_current_portfolio_name");

            await api_deleteHolding(id);

            showNotification("Holding deleted!");

            ui_renderHoldings(pid, pname, 1);
          } catch (err) {
            if (err.response && err.response.status === 400) {
              showNotification("Please delete transactions first.", true);
            } else {
              apiError(err);
            }
          }
        });
      });

      // Add to watchlist
      document.querySelectorAll(".watch-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const symbol = btn.dataset.symbol;
          await api_addWatchlist(symbol);
          ui_renderWatchlist();
        });
      });

      // Click holding → open transactions
      document.querySelectorAll(".holding-card").forEach((card) => {
        card.addEventListener("click", () => {
          const id = card.dataset.id;
          const symbol = card.dataset.symbol;
          sessionStorage.setItem("fg_current_holding_id", id);
          sessionStorage.setItem("fg_current_holding_symbol", symbol);
          ui_renderHoldingTransactions(id, symbol, 1);
        });
      });
    }

    /* pagination */

    const prev = pagination.prev || null;
    const next = pagination.next || null;
    const total = pagination.totalPages || 1;

    pag.innerHTML = `
      <button data-page="${prev || ""}"
        class="px-3 py-1 border rounded text-sm ${
          !prev ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
        }">← Prev</button>

      <span class="px-4 text-sm font-medium">
        Page ${pagination.page || 1} of ${total}
      </span>

      <button data-page="${next || ""}"
        class="px-3 py-1 border rounded text-sm ${
          !next ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
        }">Next →</button>
    `;

    pag.querySelectorAll("button[data-page]").forEach((btn) => {
      const p = btn.dataset.page;
      if (p)
        btn.addEventListener("click", () =>
          ui_renderHoldings(portfolioId, portfolioName, Number(p))
        );
    });
  }
  /* --------------------------------------------------------------------------
   CREATE HOLDING UI + FORM SUBMISSION  (FINAL FIXED VERSION)
--------------------------------------------------------------------------- */

  const addNewHoldingBtn = document.getElementById("addNewHoldingBtn");
  const addHoldingForm = document.getElementById("addHoldingForm");
  const createHoldingCancel = document.getElementById("createHoldingCancel");

  // 1. Show the Add Holding form
  if (addNewHoldingBtn) {
    addNewHoldingBtn.addEventListener("click", (e) => {
      e.preventDefault();

      addHoldingForm?.reset();

      const portfolioId = sessionStorage.getItem("fg_current_portfolio_id");
      const portfolioName = sessionStorage.getItem("fg_current_portfolio_name");

      if (!portfolioId) {
        showNotification("Select a portfolio first.", true);
        return;
      }

      ui_showView("view-holding-create");
      ui_setActive(null);

      const title = document.getElementById("holding-create-title");
      if (title) title.textContent = `Add Holding → ${portfolioName}`;

      breadcrumb_update("Overview", `${portfolioName}: Add Holding`);
    });
  }

  // 2. Submit the form → Add holding
  if (addHoldingForm) {
    addHoldingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const portfolioId = Number(
        sessionStorage.getItem("fg_current_portfolio_id")
      );
      const portfolioName = sessionStorage.getItem("fg_current_portfolio_name");

      const symbol = document.getElementById("holdingSymbol").value.trim();
      const quantity = Number(document.getElementById("holdingQty").value);
      const avg_price = Number(
        document.getElementById("holdingAvgPrice").value
      );

      if (!symbol || !quantity || !avg_price) {
        showNotification("All fields are required", true);
        return;
      }

      try {
        await api_addHolding({
          portfolio_id: portfolioId,
          symbol,
          quantity,
          avg_price,
        });

        showNotification("Holding added successfully!");

        // Return to holdings view
        ui_renderHoldings(portfolioId, portfolioName, 1);
        breadcrumb_update("Overview", `Holdings of ${portfolioName}`);
      } catch (err) {
        apiError(err);
      }
    });
  }

  // 3. Cancel button → Return to holdings list
  if (createHoldingCancel) {
    createHoldingCancel.addEventListener("click", (e) => {
      e.preventDefault();

      const pid = sessionStorage.getItem("fg_current_portfolio_id");
      const pname = sessionStorage.getItem("fg_current_portfolio_name");

      ui_renderHoldings(pid, pname, 1);
      breadcrumb_update("Overview", `Holdings of ${pname}`);
    });
  }

  /* HOLDINGS BACK BUTTON */
  const backToPortfolios = document.getElementById("backToPortfolios");

  if (backToPortfolios) {
    backToPortfolios.addEventListener("click", (e) => {
      e.preventDefault();

      ui_setActive("link-portfolios");
      ui_showView("view-portfolios");
      pageTitle.textContent = "My Portfolios";
      const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
      ui_renderPortfolioList(saved);
    });
  }

  /* ==========================================================================
     16. HOLDING TRANSACTIONS UI
     ========================================================================== */

  async function ui_renderHoldingTransactions(holdingId, symbol, page = 1) {
    ui_showView("view-holding-transactions");
    document
      .getElementById("transactions-table-container")
      .classList.remove("hidden");
    document
      .getElementById("transaction-form-container")
      .classList.add("hidden");

    const title = document.getElementById("holding-transactions-title");
    title.textContent = `Transactions: ${symbol}`;

    const { transactions, pagination } = await api_getHoldingTransactions(
      holdingId,
      page
    );

    const list = document.getElementById("transactions-list");
    const pag = document.getElementById("transactions-pagination");

    list.innerHTML = "";
    pag.innerHTML = "";

    if (!transactions.length) {
      list.innerHTML = `
        <div class="text-center text-slate-500 py-6">
          No transactions yet.
        </div>
      `;
    } else {
      transactions.forEach((t) => {
        list.innerHTML += `
    <div class="border border-slate-200 rounded p-3">
      <div class="flex justify-between items-center">
        <div>
          <div class="font-bold text-slate-800">${t.txn_type}</div>
          <div class="text-sm text-slate-600">
            Qty: ${t.qty} @ ₹${t.price}
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-sm text-slate-500">
            ${new Date(t.createdAt).toLocaleString()}
          </div>

          <button class="delete-transaction-btn text-red-600 text-sm"
                  data-id="${t.id}">
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
      });
    }
    document.querySelectorAll(".delete-transaction-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        if (!confirm("Delete this transaction?")) return;

        try {
          const hid = sessionStorage.getItem("fg_current_holding_id");
          const symbol = sessionStorage.getItem("fg_current_holding_symbol");

          await api_deleteTransaction(id);

          showNotification("Transaction deleted!");

          ui_renderHoldingTransactions(hid, symbol, 1);
        } catch (err) {
          apiError(err);
        }
      });
    });

    const prev = pagination.prev || null;
    const next = pagination.next || null;
    const total = pagination.totalPages || 1;

    pag.innerHTML = `
      <button data-page="${prev || ""}"
        class="px-3 py-1 border rounded text-sm ${
          !prev ? "opacity-40 cursor-not-allowed" : ""
        }">← Prev</button>

      <span class="px-4 text-sm font-medium">
        Page ${pagination.page || 1} of ${total}
      </span>

      <button data-page="${next || ""}"
        class="px-3 py-1 border rounded text-sm ${
          !next ? "opacity-40 cursor-not-allowed" : ""
        }">Next →</button>
    `;

    pag.querySelectorAll("button[data-page]").forEach((btn) => {
      const p = btn.dataset.page;
      if (p) {
        btn.addEventListener("click", () =>
          ui_renderHoldingTransactions(holdingId, symbol, Number(p))
        );
      }
    });
  }
  /* ==========================================================================
   ADD TRANSACTION UI HANDLERS  (FINAL)
   ========================================================================== */

  const openAddTransactionBtn = document.getElementById(
    "openAddTransactionBtn"
  );
  const cancelTransactionBtn = document.getElementById("cancelTransactionBtn");
  const addTransactionForm = document.getElementById("addTransactionForm");

  // Show form → hide table
  if (openAddTransactionBtn) {
    openAddTransactionBtn.addEventListener("click", () => {
      document
        .getElementById("transactions-table-container")
        .classList.add("hidden");
      document
        .getElementById("transaction-form-container")
        .classList.remove("hidden");
    });
  }

  // Cancel → hide form, show table again
  if (cancelTransactionBtn) {
    cancelTransactionBtn.addEventListener("click", (e) => {
      e.preventDefault();

      document
        .getElementById("transaction-form-container")
        .classList.add("hidden");
      document
        .getElementById("transactions-table-container")
        .classList.remove("hidden");
    });
  }

  // Submit → add transaction
  if (addTransactionForm) {
    addTransactionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const holdingId = Number(sessionStorage.getItem("fg_current_holding_id"));
      const symbol = sessionStorage.getItem("fg_current_holding_symbol");

      const payload = {
        holdingId,
        symbol,
        qty: Number(document.getElementById("txnQty").value),
        price: Number(document.getElementById("txnPrice").value),
        txn_type: document.getElementById("txnType").value,
      };

      try {
        await api_addTransaction(payload);

        showNotification("Transaction added!");

        ui_renderHoldingTransactions(holdingId, symbol, 1);
      } catch (err) {
        apiError(err);
      }
    });
  }

  const backToHoldings = document.getElementById("backToHoldings");

  if (backToHoldings) {
    backToHoldings.addEventListener("click", (e) => {
      e.preventDefault();

      const pid = sessionStorage.getItem("fg_current_portfolio_id");
      const pname = sessionStorage.getItem("fg_current_portfolio_name");

      ui_renderHoldings(pid, pname, 1);
    });
  }

  /* ==========================================================================
   17. WATCHLIST UI
========================================================================== */

  async function ui_renderWatchlist(page = 1) {
    ui_showView("view-watchlist");
    ui_setActive("link-watchlist");

    const { items, pagination } = await api_getWatchlist(page);

    const list = document.getElementById("watchlist-items");
    const empty = document.getElementById("watchlist-empty");
    const pag = document.getElementById("watchlist-pagination");

    list.innerHTML = "";
    pag.innerHTML = "";

    if (!items.length) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    items.forEach((w) => {
      list.innerHTML += `
      <div class="watchlist-card border border-slate-200 p-4 rounded-lg flex justify-between items-center"
           data-symbol="${w.symbol}">

        <div>
          <div class="text-lg font-bold text-slate-800">${w.symbol}</div>
          <div class="text-sm text-slate-500" id="wl-${w.symbol}">
            Loading...
          </div>
        </div>

        <div class="flex gap-3">
          <button class="wl-explore text-blue-600 underline text-sm">Explore</button>
          <button class="wl-remove text-red-600 underline text-sm">Remove</button>
        </div>

      </div>
    `;
    });

    /* Load live/last prices */
    for (const w of items) {
      const q = await api_getMarketQuote(w.symbol);
      const el = document.getElementById(`wl-${w.symbol}`);
      if (el && q) el.textContent = `Last: ₹${q.price}`;
    }

    /* Explore */
    document.querySelectorAll(".wl-explore").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const symbol = btn.closest(".watchlist-card").dataset.symbol;
        openMarketPanel(symbol);
      });
    });

    /* Remove */
    document.querySelectorAll(".wl-remove").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const symbol = btn.closest(".watchlist-card").dataset.symbol;
        await api_removeWatchlist(symbol);
        showNotification(`${symbol} removed from watchlist`);
        ui_renderWatchlist(page);
      })
    );

    /* Pagination */
    const prev = pagination.prev;
    const next = pagination.next;
    const total = pagination.totalPages;

    pag.innerHTML = `
    <button data-page="${prev || ""}"
      class="px-3 py-1 border rounded text-sm ${
        !prev ? "opacity-40 cursor-not-allowed" : ""
      }">← Prev</button>

    <span class="px-4 text-sm">Page ${pagination.page} of ${total}</span>

    <button data-page="${next || ""}"
      class="px-3 py-1 border rounded text-sm ${
        !next ? "opacity-40 cursor-not-allowed" : ""
      }">Next →</button>
  `;

    pag.querySelectorAll("button[data-page]").forEach((btn) => {
      const p = btn.dataset.page;
      if (p) btn.addEventListener("click", () => ui_renderWatchlist(Number(p)));
    });
  }

  /* ==========================================================================
   18. MARKET PANEL (Explore Symbol)
========================================================================== */

  let marketChart = null;

  async function openMarketPanel(symbol) {
    // HARD FIX: Prevent corrupted symbols like [object Object]
    if (
      !symbol ||
      typeof symbol !== "string" ||
      symbol.includes("[object Object]")
    ) {
      console.warn("Invalid symbol passed to openMarketPanel:", symbol);
      return; // stop before calling backend
    }
    const panel = document.getElementById("market-panel");
    const title = document.getElementById("market-title");
    const priceEl = document.getElementById("market-live-price");
    const extraEl = document.getElementById("market-extra");
    sessionStorage.setItem("fg_current_market_symbol", symbol);
    panel.classList.remove("hidden");
    title.textContent = symbol;
    updateWatchlistToggleButton(symbol);
    const q = await api_getMarketQuote(symbol);
    console.log("OPEN PANEL SYMBOL =", symbol, typeof symbol);

    if (!q) {
      priceEl.textContent = "Unavailable";
      return;
    }

    priceEl.textContent = `₹${q.price}`;
    const color = q.change >= 0 ? "text-green-600" : "text-red-600";

    extraEl.innerHTML = `
      <div>Change: <span class="${color}">${q.change} (${q.change_percent}%)</span></div>
      <div>Open: ₹${q.open}</div>
      <div>High: ₹${q.high}</div>
      <div>Low: ₹${q.low}</div>
      <div>Prev Close: ₹${q.prevClose}</div>
  `;

    renderMarketMiniChart(symbol);
  }
  /* ==========================================================================
   WATCHLIST TOGGLE BUTTON (ADD / REMOVE)
========================================================================== */

  function updateWatchlistToggleButton(symbol) {
    const btn = document.getElementById("addToWatchlistBtn");
    if (!btn) return;

    api_getWatchlist(1).then(({ items }) => {
      const exists = items.some((i) => i.symbol === symbol);

      if (exists) {
        btn.textContent = "Remove from Watchlist";
        btn.dataset.action = "remove";
        btn.classList.remove("bg-blue-600");
        btn.classList.add("bg-red-600");
      } else {
        btn.textContent = "Add to Watchlist";
        btn.dataset.action = "add";
        btn.classList.remove("bg-red-600");
        btn.classList.add("bg-blue-600");
      }
    });
  }

  /* BUTTON CLICK HANDLER */
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#addToWatchlistBtn")) return;

    const btn = e.target.closest("#addToWatchlistBtn");
    const symbol = sessionStorage.getItem("fg_current_market_symbol");
    if (!symbol) return;

    const action = btn.dataset.action;

    if (action === "add") {
      await api_addWatchlist(symbol);
      showNotification(`${symbol} added to watchlist`);
    } else {
      await api_removeWatchlist(symbol);
      showNotification(`${symbol} removed from watchlist`);
    }

    // update button state
    updateWatchlistToggleButton(symbol);

    // refresh list
    ui_renderWatchlist(1);
  });

  /* Close panel */
  document.getElementById("closeMarketPanel")?.addEventListener("click", () => {
    document.getElementById("market-panel").classList.add("hidden");
  });

  async function renderMarketMiniChart(symbol) {
    const canvas = document.getElementById("market-mini-chart");
    const history = await api_getMarketHistory(symbol);

    console.log("Chart History:", history);

    if (!history.length) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const labels = history.map((h) => h.time);
    const prices = history.map((h) => h.price);

    // destroy previous chart
    if (marketChart) marketChart.destroy();

    marketChart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${symbol} Price`,
            data: prices,
            borderWidth: 2,
            borderColor: "blue",
            tension: 0.3,
            fill: false,
            pointRadius: 3, // show points
            pointBackgroundColor: "blue", // visible dots
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }, // we hide for compact panel
        },
        scales: {
          x: {
            display: true, // ← ENABLE X AXIS
            ticks: { maxRotation: 0, autoSkip: true },
            grid: { display: false },
          },
          y: {
            display: true, // ← ENABLE Y AXIS
            ticks: {
              callback: (v) => `₹${v}`,
            },
            grid: { display: true },
          },
        },
      },
    });
  }

  /* ======================================================================
   MARKET SEARCH + AUTOCOMPLETE (MERGED & CLEANED)
====================================================================== */

  const marketSearchInput = document.getElementById("marketSearch");
  const marketSearchBtn = document.getElementById("marketSearchBtn");
  const marketResult = document.getElementById("marketResult");
  const autoList = document.getElementById("marketAutoComplete");

  /* -----------------------------------------
   BACKEND SEARCH: Symbol autocomplete
----------------------------------------- */

  async function api_searchSymbols(query) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/market/search/${query}`,
        authHeaders
      );
      return res.data.results; // array of symbols
    } catch (err) {
      return [];
    }
  }

  /* -----------------------------------------
   AUTOCOMPLETE: Input typing
----------------------------------------- */

  marketSearchInput.addEventListener("input", async () => {
    const text = marketSearchInput.value.trim();

    if (!text) {
      autoList.classList.add("hidden");
      autoList.innerHTML = "";
      return;
    }

    const matches = await api_searchSymbols(text);

    if (!matches.length) {
      autoList.classList.add("hidden");
      return;
    }
    autoList.innerHTML = matches
      .map(
        (m) => `
      <li class="px-3 py-2 cursor-pointer hover:bg-slate-100"
          data-symbol="${m.symbol}">
        ${m.symbol} — ${m.name}
      </li>`
      )
      .join("");

    autoList.classList.remove("hidden");
  });

  /* -----------------------------------------
   AUTOCOMPLETE CLICK → OPEN PANEL
----------------------------------------- */

  autoList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    const symbol = li.dataset.symbol;
    marketSearchInput.value = symbol;

    autoList.classList.add("hidden");
    openMarketPanel(symbol);
  });

  /* -----------------------------------------
   CLICK OUTSIDE → hide dropdown
----------------------------------------- */

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#marketSearch")) {
      autoList.classList.add("hidden");
    }
  });

  /* -----------------------------------------
   SEARCH BUTTON → detailed quote + Explore
----------------------------------------- */

  marketSearchBtn.addEventListener("click", () => {
    performMarketSearch();
  });

  /* ENTER key triggers search */
  marketSearchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performMarketSearch();
    }
  });

  /* -----------------------------------------
   SEAERCH LOGIC
----------------------------------------- */

  async function performMarketSearch() {
    const symbol = marketSearchInput.value.trim().toUpperCase();

    if (!symbol) {
      showNotification("Enter a stock symbol", true);
      return;
    }

    const data = await api_getMarketQuote(symbol);

    if (!data) {
      marketResult.classList.remove("hidden");
      marketResult.innerHTML = `
      <div class="text-red-600">Symbol not found</div>
    `;
      return;
    }

    const color = data.change >= 0 ? "text-green-600" : "text-red-600";

    marketResult.classList.remove("hidden");

    marketResult.innerHTML = `
    <div class="text-xl font-bold mb-2">${data.symbol}</div>
    <div class="text-3xl font-semibold mb-2">₹${data.price}</div>

    <div class="text-sm ${color}">
      ${data.change} (${data.change_percent}%)
    </div>

    <div class="mt-3 text-sm text-slate-600 space-y-1">
      <div>Open: ₹${data.open}</div>
      <div>High: ₹${data.high}</div>
      <div>Low: ₹${data.low}</div>
      <div>Prev Close: ₹${data.prevClose}</div>
    </div>

    <button
      class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg w-full"
      id="marketSearchExploreBtn"
    >
      Explore
    </button>
  `;

    // Explore → open full panel
    document
      .getElementById("marketSearchExploreBtn")
      .addEventListener("click", () => openMarketPanel(data.symbol));
  }

  /* ==========================================================================
     19. TRENDING STOCKS
     ========================================================================== */

  async function ui_renderTrending() {
    ui_showView("view-trending");
    ui_setActive("link-trending");

    const list = document.getElementById("trending-list");
    list.innerHTML = "";

    const items = await api_getTrending();

    items.forEach((t) => {
      const color = t.change >= 0 ? "text-green-600" : "text-red-600";

      list.innerHTML += `
        <div class="trending-card border p-4 rounded-lg flex justify-between items-center hover:bg-slate-50 cursor-pointer"
             data-symbol="${t.symbol}">

          <div>
            <div class="text-lg font-bold">${t.symbol}</div>
            <div class="text-sm text-slate-600">₹${t.price}</div>
          </div>

          <div class="${color} font-medium">${t.change}%</div>
        </div>
      `;
    });

    document.querySelectorAll(".trending-card").forEach((card) => {
      card.addEventListener("click", () =>
        openMarketPanel(card.dataset.symbol)
      );
    });
  }

  /* ==========================================================================
     20. HEATMAP (Market Overview)
     ========================================================================== */

  async function ui_renderHeatmap() {
    ui_showView("view-market");
    ui_setActive("link-market");

    const grid = document.getElementById("heatmap-grid");
    if (!grid) return;

    const items = await api_getHeatmap();
    grid.innerHTML = "";

    items.forEach((it) => {
      const color =
        it.change > 0
          ? "bg-green-600"
          : it.change < 0
          ? "bg-red-600"
          : "bg-slate-500";

      grid.innerHTML += `
        <div class="heatmap-tile ${color} p-3 rounded-lg text-center text-white cursor-pointer relative"
             data-symbol="${it.symbol}">
             
          <div class="text-sm font-semibold">${it.symbol}</div>
          <div class="text-xs opacity-80">${it.change}%</div>

          <div class="heatmap-news hidden absolute top-full left-1/2 -translate-x-1/2 
                      mt-2 bg-white text-slate-800 text-xs p-2 rounded shadow-xl w-48 z-50">
            Loading...
          </div>
        </div>
      `;
    });

    attachHeatmapHover();
  }

  /* Tooltip + Click logic */
  function attachHeatmapHover() {
    document.querySelectorAll(".heatmap-tile").forEach((tile) => {
      const symbol = tile.dataset.symbol;
      const tip = tile.querySelector(".heatmap-news");

      tile.addEventListener("mouseenter", async () => {
        tip.classList.remove("hidden");
        tip.innerHTML = "Loading...";

        const data = await api_getNews(symbol); // backend returns { symbol, headlines }

        // Validate response
        if (!data || !data.headlines || data.headlines.length === 0) {
          tip.textContent = "No news available.";
          return;
        }

        // Show only first two news items for compact tooltip
        const items = data.headlines.slice(0, 2);

        tip.innerHTML = items
          .map(
            (n) => `
        <div class="mb-2">
          <div class="font-semibold">${n.title}</div>
          <div class="text-xs text-slate-500">${n.publisher} • ${n.publishedAt}</div>
        </div>
      `
          )
          .join("");
      });

      tile.addEventListener("mouseleave", () => {
        tip.classList.add("hidden");
      });

      // Open market panel on click
      tile.addEventListener("click", () => openMarketPanel(symbol));

      // Add to watchlist on double click
      tile.addEventListener("dblclick", async () => {
        await api_addWatchlist(symbol);
        ui_renderWatchlist();
      });
    });
  }

  /* ==========================================================================
     21. FRAUD ANALYTICS — KPIs, HISTOGRAM, MAP, RULE ENGINE, CASES
     ========================================================================== */

  /* --------------------------------------------------------------------------
     FRAUD STATISTICS KPIs
  -------------------------------------------------------------------------- */

  async function ui_renderFraudStats() {
    const stats = await api_getFraudStats();
    if (!stats) return;

    document.getElementById(
      "fraud-kpi-detection"
    ).textContent = `${stats.detection_rate.toFixed(2)}%`;

    document.getElementById(
      "fraud-kpi-fp"
    ).textContent = `${stats.false_positive_rate.toFixed(2)}%`;

    document.getElementById("fraud-kpi-total").textContent = formatShort(
      stats.total_analyzed
    );

    document.getElementById("fraud-kpi-highrisk").textContent =
      stats.high_risk_users;
  }

  /* --------------------------------------------------------------------------
     FRAUD SCORE DISTRIBUTION HISTOGRAM
  -------------------------------------------------------------------------- */

  let fraudScoreChartInstance = null;

  async function ui_renderFraudDistribution() {
    const history = await api_getFraudHistory();
    const scores = history.map((h) => h.fraudScore || 0);

    if (!scores.length) return;

    const bins = new Array(10).fill(0);
    scores.forEach((s) => {
      let idx = Math.floor(s * 10);
      if (idx === 10) idx = 9;
      bins[idx]++;
    });

    const ctx = document.getElementById("fraudScoreChart");

    if (fraudScoreChartInstance) fraudScoreChartInstance.destroy();

    fraudScoreChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "0.0-0.1",
          "0.1-0.2",
          "0.2-0.3",
          "0.3-0.4",
          "0.4-0.5",
          "0.5-0.6",
          "0.6-0.7",
          "0.7-0.8",
          "0.8-0.9",
          "0.9-1.0",
        ],
        datasets: [
          {
            label: "Fraud Score Frequency",
            data: bins,
            backgroundColor: "rgba(99,102,241,0.6)",
            borderColor: "rgba(99,102,241,1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  /* ============================================
   FRAUD GEO HEATMAP (Leaflet + GeoJSON)
   ============================================ */
  async function ui_renderGeoHeatmap() {
    const geoData = await api_getGeoRisk();
    const counts = geoData?.countries || {};

    // Remove old map instance
    if (window.geoMap) window.geoMap.remove();

    // Init map
    window.geoMap = L.map("geoRiskMap").setView([20, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 5,
    }).addTo(window.geoMap);

    // Load world GeoJSON
    const world = await fetch(
      "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
    ).then((res) => res.json());

    // Color scale
    function getColor(value) {
      if (!value) return "#E2E8F0"; // no data = light gray
      if (value < 3) return "#FBBF24"; // yellow
      if (value < 7) return "#F87171"; // light red
      return "#DC2626"; // dark red
    }

    // Draw country shapes + POPUP
    L.geoJSON(world, {
      style: (feature) => {
        const isoA2 = feature.properties["ISO3166-1-Alpha-2"];
        const count = counts[isoA2] || 0;

        return {
          fillColor: getColor(count),
          color: "#555",
          weight: 1,
          fillOpacity: 0.8,
        };
      },

      onEachFeature: (feature, layer) => {
        const isoA2 = feature.properties["ISO3166-1-Alpha-2"];
        const name = feature.properties.name;
        const count = counts[isoA2] || 0;

        // Popup on click
        layer.bindPopup(`
        <b>${name}</b><br>
        Fraud Transactions: <b>${count}</b>
      `);
      },
    }).addTo(window.geoMap);

    // ================================
    // ADD LABELS (numbers on the map)
    // ================================
    Object.keys(counts).forEach((isoA2) => {
      const count = counts[isoA2];

      // Find matching feature
      const match = world.features.find(
        (f) => f.properties["ISO3166-1-Alpha-2"] === isoA2
      );

      if (match) {
        const center = L.geoJSON(match).getBounds().getCenter();

        L.marker(center, {
          icon: L.divIcon({
            className: "fraud-label",
            html: `
            <div style="
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              text-align:center;
            ">
              ${count}
            </div>
          `,
            iconSize: [30, 20],
          }),
        }).addTo(window.geoMap);
      }
    });
  }
  /* --------------------------------------------------------------------------
     FRAUD CASES TABLE + PAGINATION
  -------------------------------------------------------------------------- */

  async function ui_renderFraudCases(page = 1) {
    const tbody = document.getElementById("fraud-cases-body");
    const empty = document.getElementById("fraud-cases-empty");
    const pag = document.getElementById("fraud-cases-pagination");

    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>`;
    pag.innerHTML = "";

    const { cases, pagination } = await api_getFraudCases(page);

    if (!cases.length) {
      empty.classList.remove("hidden");
      tbody.innerHTML = "";
      return;
    }

    empty.classList.add("hidden");
    tbody.innerHTML = "";

    cases.forEach((c) => {
      const score = Number(c.fraud_score || c.fraudScore || 0);
      const reason = c.notes || c.reason || "—";

      tbody.innerHTML += `
      <tr class="border hover:bg-slate-50 cursor-pointer">
        <td class="p-2">${c.case_id}</td>
        <td class="p-2 font-bold text-red-600">${(score * 100).toFixed(2)}%</td>
        <td class="p-2">${reason}</td>
        <td class="p-2">${new Date(c.createdAt).toLocaleString()}</td>
      </tr>
    `;
    });

    // pagination (unchanged)
    const prev = pagination.prev || null;
    const next = pagination.next || null;
    const total = pagination.totalPages || 1;

    pag.innerHTML = `
    <button data-page="${prev || ""}"
      class="px-4 py-2 border rounded ${
        !prev ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
      }">← Prev</button>

    <span class="px-4 py-2">Page ${pagination.page || 1} of ${total}</span>

    <button data-page="${next || ""}"
      class="px-4 py-2 border rounded ${
        !next ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
      }">Next →</button>
  `;

    pag.querySelectorAll("button[data-page]").forEach((btn) => {
      const p = btn.dataset.page;
      if (p)
        btn.addEventListener("click", () => ui_renderFraudCases(Number(p)));
    });
  }

  /* --------------------------------------------------------------------------
     FRAUD TESTING FORM (User input → score)
  -------------------------------------------------------------------------- */

  const fraudTestForm = document.getElementById("fraudTestForm");
  if (fraudTestForm) {
    fraudTestForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = Object.fromEntries(new FormData(fraudTestForm).entries());
      const result = await api_testFraud(payload);

      const box = document.getElementById("fraudTestResult");

      if (!result) {
        box.textContent = "Error predicting fraud score.";
        box.classList.remove("hidden");
        return;
      }

      box.innerHTML = `
        <div class="font-bold">Fraud Probability: ${(
          result.fraud_probability * 100
        ).toFixed(2)}%</div>
        <div class="${
          result.label ? "text-red-600" : "text-green-600"
        } font-semibold">
          ${result.label ? "Fraudulent Transaction" : "Normal Transaction"}
        </div>
      `;
      box.classList.remove("hidden");
    });
  }
  // ==================== RENDER ML FRAUD HISTORY ====================
  async function ui_renderFraudHistory() {
    const list = document.getElementById("fraud-history-body");
    const empty = document.getElementById("fraud-history-empty");

    list.innerHTML = "";

    const data = await api_getFraudHistory();

    if (!data || data.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    data.forEach((h) => {
      // SAFE score extraction
      const scoreRaw = h.fraudScore ?? h.fraud_score ?? 0;

      const prob = (Number(scoreRaw) * 100).toFixed(2) + "%";

      list.innerHTML += `
      <tr class="border hover:bg-slate-50 cursor-pointer fraud-row"
          data-txn="${h.transactionId}">
        
        <td class="p-2 border">${h.transactionId}</td>
        
        <td class="p-2 border">${prob}</td>
        
        <td class="p-2 border ${
          h.label === 1 ? "text-red-600" : "text-green-600"
        }">
          ${h.label === 1 ? "Fraud" : "Normal"}
        </td>
        
        <td class="p-2 border">${h.modelVersion || h.model_version || "—"}</td>
        
        <td class="p-2 border">
          ${h.createdAt ? new Date(h.createdAt).toLocaleString() : "—"}
        </td>
      </tr>
    `;
    });
  }
  // ======================================================
  // FRAUD ANALYTICS SECTION SWITCH BUTTONS
  // ======================================================

  const btnViewFraudAnalysis = document.getElementById("btnViewFraudAnalysis");
  const btnViewFraudCases = document.getElementById("btnViewFraudCases");
  const breadcrumb = document.getElementById("breadcrumb");
  // ======================================================
  // FRAUD BREADCRUMB CLICK HANDLERS
  // ======================================================

  const bcOverview = document.getElementById("bc-overview");
  const bcFraud = document.getElementById("bc-fraud");
  const bcDivider3 = document.getElementById("bc-divider-3");
  const bcSub = document.getElementById("bc-sub");

  // Click → go back to Fraud Analytics Overview
  if (bcFraud) {
    bcFraud.addEventListener("click", () => {
      // Show ONLY overview section
      document
        .getElementById("fraud-overview-section")
        .classList.remove("hidden");
      document.getElementById("fraud-analysis-section").classList.add("hidden");
      document.getElementById("fraud-cases-section").classList.add("hidden");

      // Reset breadcrumb
      bcDivider3.classList.add("hidden");
      bcSub.classList.add("hidden");

      bcSub.textContent = "";
    });
  }

  // =============================
  // Fraud Analysis History Button
  // =============================
  if (btnViewFraudAnalysis) {
    btnViewFraudAnalysis.addEventListener("click", () => {
      // Hide others
      document.getElementById("fraud-overview-section").classList.add("hidden");
      document.getElementById("fraud-cases-section").classList.add("hidden");

      // Show analysis section
      document
        .getElementById("fraud-analysis-section")
        .classList.remove("hidden");

      // Breadcrumb update
      bcDivider3.classList.remove("hidden");
      bcSub.classList.remove("hidden");
      bcSub.textContent = "Fraud Analysis History";

      // Load table
      ui_renderFraudHistory();
    });
  }

  // =============================
  // Fraud Case History Button
  // =============================
  if (btnViewFraudCases) {
    btnViewFraudCases.addEventListener("click", () => {
      // Hide others
      document.getElementById("fraud-overview-section").classList.add("hidden");
      document.getElementById("fraud-analysis-section").classList.add("hidden");

      // Show cases section
      document.getElementById("fraud-cases-section").classList.remove("hidden");

      // Breadcrumb update
      bcDivider3.classList.remove("hidden");
      bcSub.classList.remove("hidden");
      bcSub.textContent = "Fraud Case History";

      // Load cases
      ui_renderFraudCases(1);
    });
  }

  /* ==========================================================================
     23. PREMIUM FEATURES (ACTIVATION SIMULATION)
     ========================================================================== */

  //   const premiumBtn = document.getElementById("premium-btn");
  //   const premiumBlock = document.getElementById("premium-block");
  //   const goldPrices = document.getElementById("gold-prices");
  //   const premiumBadge = document.getElementById("premium-badge");

  const featuresLink = document.getElementById("link-features");

  if (premiumBtn) {
    premiumBtn.addEventListener("click", async () => {
      const res = await api_createPremiumOrder();
      if (!res || !res.payment_session_id) {
        showNotification("Unable to create order", true);
        return;
      }

      const cashfree = new Cashfree({ mode: "sandbox" });

      const result = await cashfree.checkout({
        paymentSessionId: res.payment_session_id,
        redirectTarget: "_modal",
      });

      if (result.error) {
        showNotification("Payment failed or cancelled", true);
        return;
      }

      const verify = await axios.get(
        `${BASE_URL}/api/premium/payment-status?order_id=${res.order_id}`,
        authHeaders
      );

      if (verify.data.success) {
        showNotification("Premium activated!");
        await checkPremiumUI();
      } else {
        showNotification("Payment not completed", true);
      }
    });
  }

  async function checkPremiumUI() {
    const profile = await api_getProfile();
    if (!profile) return;

    const isPremium = profile.isPremium;

    if (isPremium) {
      premiumBadge?.classList.remove("hidden");
      goldPrices?.classList.remove("hidden");
      premiumBlock?.classList.add("hidden");

      const link = document.getElementById("link-features");
      if (link) {
        link.querySelector("span.font-medium").textContent =
          "Premium Features (Active)";
      }

      loadGoldMarketData();
    } else {
      premiumBadge?.classList.add("hidden");
      goldPrices?.classList.add("hidden");
      premiumBlock?.classList.remove("hidden");
    }
  }

  /* --------------------------------------------------------------------------
   GOLD MARKET UI RENDER
-------------------------------------------------------------------------- */

  let goldChartInstance = null;

  async function loadGoldMarketData() {
    // 1) Today + Yesterday + Forecast
    const todayData = await api_getGoldMarketData();
    if (!todayData || !todayData.success) return;

    const { today, yesterday, forecast } = todayData;

    // TODAY
    document.getElementById("gold-today-price").textContent = `₹${today.price}`;
    document.getElementById(
      "gold-today-change"
    ).textContent = `${today.percent}%`;

    // YESTERDAY
    document.getElementById(
      "gold-yesterday-price"
    ).textContent = `₹${yesterday.price}`;
    document.getElementById(
      "gold-yesterday-change"
    ).textContent = `${yesterday.percent}%`;

    // FORECAST
    document.getElementById(
      "gold-forecast-price"
    ).textContent = `₹${forecast.price}`;
    document.getElementById(
      "gold-forecast-change"
    ).textContent = `${forecast.percent}%`;

    // 2) 7-DAY HISTORY
    const historyData = await api_getGoldHistory();
    if (!historyData || !historyData.success) return;

    drawGold7DayChart(historyData.history);
  }

  function drawGold7DayChart(history) {
    const ctx = document.getElementById("gold-7day-chart");

    const labels = history.map((h) => h.date);
    const prices = history.map((h) => h.price);

    if (goldChartInstance) goldChartInstance.destroy();

    goldChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Gold Price (INR)",
            data: prices,
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    });
  }

  /* ==========================================================================
     24. TAB SYSTEM (Used in Analytics Views or Overview Tabs)
     ========================================================================== */

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabContents.forEach((c) => c.classList.add("hidden"));
      const tabId = btn.dataset.target;
      document.getElementById(tabId)?.classList.remove("hidden");
    });
  });

  /* ==========================================================================
     25. TOAST HANDLING
     ========================================================================== */

  setTimeout(() => {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.style.opacity = "0";
    toast.style.transition = "0.5s";

    setTimeout(() => (toast.style.display = "none"), 500);
  }, 5000);

  /* ==========================================================================
     26. MOBILE NAVIGATION (Main Menu + Management Menu)
     ========================================================================== */

  const mobileMainMenuBtn = document.getElementById("mobile-mainmenu-btn");
  const mobileMgmtMenuBtn = document.getElementById("mobile-management-btn");

  //const mobileOverlay = document.getElementById("mobile-overlay");
  const mobileMainMenuPanel = document.getElementById("mobile-mainmenu-panel");
  const mobileManagementPanel = document.getElementById(
    "mobile-management-panel"
  );

  function mobile_closePanels() {
    mobileMainMenuPanel?.classList.add("hidden");
    mobileManagementPanel?.classList.add("hidden");
    mobileOverlay?.classList.add("hidden");
  }

  function mobile_openPanel(panel) {
    mobile_closePanels();
    panel?.classList.remove("hidden");
    mobileOverlay?.classList.remove("hidden");
  }

  mobileMainMenuBtn?.addEventListener("click", () =>
    mobile_openPanel(mobileMainMenuPanel)
  );

  mobileMgmtMenuBtn?.addEventListener("click", () =>
    mobile_openPanel(mobileManagementPanel)
  );

  mobileOverlay?.addEventListener("click", () => {
    mobile_closePanels();
  });

  /* ---- MOBILE SIDEBAR LINKS ---- */

  document.querySelectorAll("[data-target-link]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.dataset.targetLink;

      ui_setActive(targetId);
      ui_showView(views[targetId]);
      pageTitle.textContent = titles[targetId] || "";

      mobile_closePanels();

      // Special cases
      if (targetId === "link-portfolios") {
        const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        ui_renderPortfolioList(saved);
        breadcrumb_update("Overview", "Portfolios");
      } else if (targetId === "link-market") {
        ui_showView("view-market");
        pageTitle.textContent = "Market";
        breadcrumb_update("Overview", "Market");
        ui_renderHeatmap();
      } else if (targetId === "link-overview") {
        breadcrumb_update(null);
      }
    });
  });

  /* ==========================================================================
     27. MOBILE OVERVIEW SUBMENU
     ========================================================================== */

  //const mobileOverviewToggle = document.getElementById("mobile-overview-toggle");
  const mobileOverviewSubmenu = document.getElementById(
    "mobile-overview-submenu"
  );

  if (mobileOverviewToggle) {
    mobileOverviewToggle.addEventListener("click", () => {
      const expanded =
        mobileOverviewToggle.getAttribute("aria-expanded") === "true";

      mobileOverviewToggle.setAttribute(
        "aria-expanded",
        (!expanded).toString()
      );
      mobileOverviewSubmenu.classList.toggle("hidden");
    });
  }

  /* ==========================================================================
     28. BREADCRUMBS HANDLING
     ========================================================================== */

  const breadcrumbRoot = document.getElementById("breadcrumb-overview");
  const breadcrumbDivider = document.getElementById("breadcrumb-divider");
  const breadcrumbSub = document.getElementById("breadcrumb-sub");

  function breadcrumb_update(main = null, sub = null) {
    if (!breadcrumbRoot || !breadcrumbDivider || !breadcrumbSub) return;

    // no breadcrumb
    if (!main) {
      breadcrumbRoot.style.display = "none";
      breadcrumbDivider.classList.add("hidden");
      breadcrumbSub.classList.add("hidden");
      breadcrumbSub.textContent = "";
      return;
    }

    // show root
    breadcrumbRoot.style.display = "inline";

    // show/hide divider + sublabel
    breadcrumbDivider.classList.toggle("hidden", !sub);
    breadcrumbSub.classList.toggle("hidden", !sub);

    breadcrumbSub.textContent = sub;
  }

  breadcrumbRoot?.addEventListener("click", (e) => {
    e.preventDefault();

    // close submenu
    const subMenu = document.getElementById("overview-submenu");
    const toggle = document.getElementById("link-overview-toggle");

    if (subMenu && !subMenu.classList.contains("hidden")) {
      subMenu.classList.add("hidden");
      toggle?.setAttribute("aria-expanded", "false");
    }

    ui_setActive("link-overview");
    ui_showView("view-overview");
    pageTitle.textContent = "Portfolio Overview";
    breadcrumb_update(null);
  });
  /* ==========================================================================
     29. USER PROFILE LOADING (Header + Settings Form)
     ========================================================================== */

  async function user_loadProfile() {
    if (!requireAuth()) return;

    try {
      const res = await axios.get(`${BASE_URL}/api/user/fetch/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = res.data.user;
      if (!user) return;

      /* HEADER DROPDOWN SECTION */
      updateProfileDropdown(user);

      /* SETTINGS FORM */
      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const phoneInput = document.getElementById("phone");

      if (nameInput) nameInput.value = user.name;
      if (emailInput) emailInput.value = user.email;
      if (phoneInput) phoneInput.value = user.phone || "Not Provided";

      /* AVATAR */
      const profileAvatar = document.getElementById("profileAvatar");
      if (profileAvatar) {
        profileAvatar.textContent = user.name?.charAt(0).toUpperCase() || "?";
      }

      /* HEADER NAME + ROLE */
      const headerName = document.querySelector(
        "header .group .text-sm.font-semibold"
      );
      const headerRole = document.querySelector(
        "header .group .text-xs.text-slate-500"
      );

      if (headerName) headerName.textContent = user.name;
      if (headerRole) headerRole.textContent = user.role || "User";
    } catch (err) {
      apiError(err);
    }
  }

  /* ==========================================================================
     30. REAL-TIME ENGINE (WebSockets) — FINAL VERSION
     ========================================================================== */

  let socket = null;

  function realtime_initSocket() {
    if (!requireAuth()) return;

    socket = io(BASE_URL, { auth: { token } });

    socket.on("connect", () => {
      showNotification("Real-time updates connected", false);
    });

    socket.on("disconnect", () => {
      showNotification("Connection lost. Reconnecting...", true);
    });

    /* REAL-TIME EVENTS */
    socket.on("portfolio_added", async (data) => {
      showNotification(`New Portfolio Added: ${data.name}`);
      const active = sessionStorage.getItem("fg_current_view");
      if (active === "link-portfolios") {
        const page = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        ui_renderPortfolioList(page);
      }
    });

    socket.on("holding_addedTO_portfolio", async (data) => {
      showNotification(`New Holding Added: ${data.symbol}`);
      const currentId = Number(
        sessionStorage.getItem("fg_current_portfolio_id")
      );
      const name = sessionStorage.getItem("fg_current_portfolio_name");
      if (currentId === Number(data.portfolio_id)) {
        ui_renderHoldings(currentId, name, 1);
      }
    });

    socket.on("transaction_added", async (data) => {
      const currentHoldingId = Number(
        sessionStorage.getItem("fg_current_holding_id")
      );
      const symbol = sessionStorage.getItem("fg_current_holding_symbol");

      if (currentHoldingId === Number(data.holding_id)) {
        ui_renderHoldingTransactions(currentHoldingId, symbol, 1);
      }

      const portfolioId = sessionStorage.getItem("fg_current_portfolio_id");
      const portfolioName = sessionStorage.getItem("fg_current_portfolio_name");
      ui_renderHoldings(portfolioId, portfolioName, 1);
    });

    socket.on("ticker_update", (list) => {
      list.forEach((t) => {
        const wl = document.getElementById(`wl-${t.symbol}`);
        if (wl) wl.textContent = `Last: ₹${t.price.toFixed(2)}`;

        const liveBox = document.getElementById(`live-${t.symbol}`);
        if (liveBox) {
          liveBox.innerHTML = `<div class="font-semibold">₹${t.price.toFixed(
            2
          )}</div>`;
        }
      });
    });

    socket.on("fraud_alert", async (data) => {
      showNotification(`Fraud Alert — Score: ${data.fraud_score}`);
      ui_renderFraudStats();
      ui_renderFraudDistribution();
      //ui_renderGeoHeatmap();
      ui_renderFraudCases(1);
    });
  }

  /* ==========================================================================
     31. MAIN INITIALIZER — FINAL
     ========================================================================== */

  async function initUserConsole() {
    await user_loadProfile();
    await checkPremiumUI();
    realtime_initSocket();

    const storedLinkId = sessionStorage.getItem(STORE_CURRENT_VIEW);

    if (storedLinkId && views[storedLinkId]) {
      // Restore last view
      ui_setActive(storedLinkId);
      ui_showView(views[storedLinkId]);
      pageTitle.textContent = titles[storedLinkId] || "Dashboard";

      if (storedLinkId === "link-portfolios") {
        const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        ui_renderPortfolioList(saved);
        breadcrumb_update("Overview", "Portfolios");
      } else if (storedLinkId === "link-market") {
        ui_renderHeatmap();
        breadcrumb_update("Overview", "Market");
      } else if (storedLinkId === "link-fraud") {
        ui_renderFraudStats();
        ui_renderFraudDistribution();

        ui_renderGeoHeatmap();

        document
          .getElementById("fraud-overview-section")
          .classList.remove("hidden");

        document
          .getElementById("fraud-analysis-section")
          .classList.add("hidden");

        document.getElementById("fraud-cases-section").classList.add("hidden");

        breadcrumb_update("Overview", "Fraud Analytics");
      }
    } else {
      // Default = Overview
      ui_setActive("link-overview");
      ui_showView("view-overview");
      pageTitle.textContent = "Portfolio Overview";
      breadcrumb_update(null);
      sessionStorage.setItem(STORE_CURRENT_VIEW, "link-overview");
    }
  }

  /* ==========================================================================
     32. START
     ========================================================================== */

  initUserConsole();

  // ==================================================
  // FRAUD TEST MODAL (Button + Popup)
  // ==================================================

  const fraudBtn = document.getElementById("testFraudBtn");
  const fraudModal = document.getElementById("fraudModal");
  const fraudModalClose = document.getElementById("fraudModalClose");
  const fraudModalContent = document.getElementById("fraudModalContent");

  if (fraudBtn) {
    fraudBtn.addEventListener("click", async () => {
      try {
        const payload = {
          transactionId: "TXN-" + Date.now(),
          amount: Math.floor(Math.random() * 5000) + 100,
          merchant: "TestVendor",
          purpose: "Test Purchase",
          geo: { country: "IN" },
          deviceInfo: { ip: "127.0.0.1" },
        };

        const result = await api_testFraud(payload);

        if (!result) {
          fraudModalContent.innerHTML =
            "<div class='text-red-600'>Error predicting fraud score.</div>";
        } else {
          fraudModalContent.innerHTML = `
          <div><strong>Fraud Probability:</strong> ${result.fraud_probability.toFixed(
            3
          )}</div>
          <div><strong>Label:</strong> ${
            result.label === 1
              ? "<span class='text-red-600 font-bold'>FRAUD</span>"
              : "<span class='text-green-600 font-bold'>NORMAL</span>"
          }</div>
          <div><strong>Model:</strong> ${result.model_version}</div>
          <div><strong>Reasons:</strong></div>
          <ul class="list-disc ml-4">
            ${
              (result.reasons || []).length
                ? result.reasons.map((r) => `<li>${r}</li>`).join("")
                : "<li>None</li>"
            }
          </ul>
        `;
        }

        fraudModal.classList.remove("hidden");

        await ui_renderFraudHistory();
        ui_renderFraudStats();
        ui_renderFraudDistribution();
      } catch (err) {
        console.error(err);
        fraudModalContent.innerHTML =
          "<div class='text-red-600'>Something went wrong.</div>";
        fraudModal.classList.remove("hidden");
      }
    });
  }

  if (fraudModalClose) {
    fraudModalClose.addEventListener("click", () => {
      fraudModal.classList.add("hidden");
    });
  }

  // close when clicking outside
  if (fraudModal) {
    fraudModal.addEventListener("click", (e) => {
      if (e.target === fraudModal) fraudModal.classList.add("hidden");
    });
  }
  // ==================== OPEN / CLOSE FRAUD DETAIL MODAL ====================
  function openFraudDetailModal() {
    document.getElementById("fraud-detail-modal").classList.remove("hidden");
  }

  function closeFraudDetailModal() {
    document.getElementById("fraud-detail-modal").classList.add("hidden");
  }

  document
    .getElementById("close-fraud-detail")
    .addEventListener("click", closeFraudDetailModal);
  // ==================== FRAUD DETAIL CLICK HANDLER ====================
  document.addEventListener("click", async (e) => {
    if (e.target.closest(".fraud-row")) {
      const row = e.target.closest(".fraud-row");
      const txnId = row.dataset.txn;

      const detail = await api_getFraudDetail(txnId);
      if (!detail) return;

      document.getElementById("detail-txn").textContent = detail.transactionId;
      document.getElementById("detail-score").textContent =
        (detail.fraudScore * 100).toFixed(2) + "%";
      document.getElementById("detail-label").textContent = detail.label
        ? "Fraud"
        : "Normal";
      document.getElementById("detail-model").textContent = detail.modelVersion;

      const ul = document.getElementById("detail-reasons");
      ul.innerHTML = detail.reasons?.length
        ? detail.reasons.map((r) => `<li>${r}</li>`).join("")
        : "<li>No reasons</li>";

      openFraudDetailModal();
    }
  });
});
