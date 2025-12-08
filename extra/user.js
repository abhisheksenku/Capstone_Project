/* =============================================================================
   FIN-GUARD USER DASHBOARD SCRIPT
   Clean architecture • Modular • Backend-ready • WebSocket-enabled
============================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     01. CONFIGURATION + GLOBAL STATE
     ========================================================================== */

  const BASE_URL = window.location.origin;
  const token = sessionStorage.getItem("token");
  let holdingsInterval = null;
  let fraudScoreChartInstance = null;
  let geoRiskMapInstance = null;

  // session keys
  const STORE_CURRENT_VIEW = "fg_current_view";
  const STORE_PORTFOLIO_PAGE = "fg_portfolio_page";

  // --- Unified API error handler ---
  function apiError(err) {
    const msg = err?.response?.data || err?.message || "Unknown API Error";
    console.error("API Error:", msg);
  }

  // Token guard utility
  function requireAuth() {
    const token = sessionStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return false;
    }
    return true;
  }

  /* ==========================================================================
     02. ELEMENT REFERENCES
     ========================================================================== */

  const pageTitleElement = document.getElementById("page-title");
  const navLinks = document.querySelectorAll(".sidebar-link");

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

  const pageTitles = {
    "link-overview": "Portfolio Overview",
    "link-portfolios": "My Portfolios",
    "link-market": "Market",
    "link-watchlist": "My Watchlist",
    "link-trending": "Trending Stocks",
    "link-fraud": "Fraud Analytics & Detection",
    "link-alerts": "System & Risk Alerts",
    "link-settings": "User Profile",
    "link-features": "Features (Premium)",
  };

  // cached DOM nodes that may be needed in multiple places (nullable)
  const overviewToggle = document.getElementById("link-overview-toggle");
  const overviewSubmenu = document.getElementById("overview-submenu");
  const portfolioListEl = document.getElementById("portfolio-list");
  const portfolioPagEl = document.getElementById("portfolio-pagination");
  const addNewPortfolioBtn = document.getElementById("addNewPortfolioBtn");
  const portfolioCreateForm = document.getElementById("portfolioCreateForm");
  const createPortfolioCancel = document.getElementById(
    "createPortfolioCancel"
  );
  const breadcrumbRoot = document.getElementById("breadcrumb-overview");
  const breadcrumbDivider = document.getElementById("breadcrumb-divider");
  const breadcrumbSub = document.getElementById("breadcrumb-sub");
  const addNewHoldingBtn = document.getElementById("addNewHoldingBtn");
  const createHoldingCancel = document.getElementById("createHoldingCancel");

  const transactionsListEl = document.getElementById("transactions-list");
  const transactionsPagEl = document.getElementById("transactions-pagination");
  const addNewTransactionBtn = document.getElementById("addNewTransactionBtn");
  const addTransactionForm = document.getElementById("addTransactionForm");
  const createTransactionCancel = document.getElementById(
    "createTransactionCancel"
  );
  const backToHoldings = document.getElementById("backToHoldings");

  /* ==========================================================================
     03. GENERIC HELPERS
     ========================================================================== */
  function showFraudLiveAlert(message) {
    const box = document.getElementById("fraud-live-alert");
    if (!box) return;

    box.textContent = message;
    box.classList.remove("hidden");
    box.style.opacity = "1";

    setTimeout(() => {
      box.style.opacity = "0";
      setTimeout(() => {
        box.classList.add("hidden");
      }, 300);
    }, 6000);
  }

  function ui_showView(viewId) {
    document.querySelectorAll(".view-section").forEach((v) => {
      v.classList.add("hidden");
    });

    const target = document.getElementById(viewId);
    if (target) target.classList.remove("hidden");
    if (viewId !== "view-holdings" && holdingsInterval) {
      clearInterval(holdingsInterval);
      holdingsInterval = null;
    }

    // No sessionStorage writes here
    // No warnings or debug logs
  }

  function ui_setActiveLink(linkId) {
    navLinks.forEach((l) => l.classList.remove("active"));
    if (!linkId) {
      // if null: clear stored active link but keep view
      sessionStorage.removeItem(STORE_CURRENT_VIEW);
    }
    const activeLink = linkId ? document.getElementById(linkId) : null;
    if (activeLink) activeLink.classList.add("active");

    // Auto-open Overview submenu when child links are active
    const _overviewSubmenu = document.getElementById("overview-submenu");
    const _overviewToggle = document.getElementById("link-overview-toggle");

    if (linkId === "link-overview" || linkId === "link-portfolios") {
      _overviewSubmenu?.classList.remove("hidden");
      _overviewToggle?.setAttribute("aria-expanded", "true");
    } else {
      _overviewSubmenu?.classList.add("hidden");
      _overviewToggle?.setAttribute("aria-expanded", "false");
    }

    // Save the active link id (so we can restore UI highlight on reload)
    if (linkId) sessionStorage.setItem(STORE_CURRENT_VIEW, linkId);
  }

  function breadcrumb_update(main = null, sub = null) {
    if (!breadcrumbRoot || !breadcrumbDivider || !breadcrumbSub) return;
    if (!main) {
      breadcrumbRoot.style.display = "none";
      breadcrumbDivider.classList.add("hidden");
      breadcrumbSub.classList.add("hidden");
      breadcrumbSub.textContent = "";
      return;
    }
    breadcrumbRoot.style.display = "inline";
    breadcrumbDivider.classList.toggle("hidden", !sub);
    breadcrumbSub.classList.toggle("hidden", !sub);
    breadcrumbSub.textContent = sub ? `${sub}` : main;
  }

  /* ==========================================================================
     04. USER SESSION MANAGEMENT
     ========================================================================== */

  async function user_loadProfile() {
    if (!requireAuth()) return;

    try {
      const res = await axios.get(`${BASE_URL}/api/user/fetch/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = res.data.user;
      if (!user) return;

      /* ---- Header Dropdown ---- */
      const dropdown = document.getElementById("profileDropdown");
      if (dropdown) {
        dropdown.innerHTML = `
          <div class="font-semibold text-slate-800">${user.name}</div>
          <div class="text-sm text-slate-500 mb-3">${user.email}</div>
          <button id="dropdownProfileBtn" class="w-full bg-rose-600 text-white py-1.5 rounded-md hover:bg-rose-700 transition">
            View Profile
          </button>
        `;
        // attach listener after injection
        const profileBtn = document.getElementById("dropdownProfileBtn");
        if (profileBtn) {
          profileBtn.addEventListener("click", () => {
            ui_setActiveLink("link-settings");
            ui_showView("view-settings");
            pageTitleElement.textContent = "User Profile";
            dropdown.classList.add("hidden"); // close dropdown
          });
        }
      }

      /* ---- Settings → Profile Form ---- */
      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const phoneInput = document.getElementById("phone");

      if (nameInput) nameInput.value = user.name;
      if (emailInput) emailInput.value = user.email;
      if (phoneInput) phoneInput.value = user.phone || "Not Provided";

      /* ---- Avatar (first letter) ---- */
      const profileAvatar = document.getElementById("profileAvatar");
      if (profileAvatar) {
        profileAvatar.textContent = user.name?.charAt(0).toUpperCase() || "?";
      }

      /* ---- Header Right Profile ---- */
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
   05. NAVIGATION SYSTEM (Desktop + Mobile)
=========================================================================== */

  // Desktop sidebar navigation
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const linkId = link.id;
      const viewId = views[linkId];

      console.log("NAV CLICK → linkId:", linkId, "viewId:", viewId);

      ui_setActiveLink(linkId);
      ui_showView(viewId);

      sessionStorage.setItem(STORE_CURRENT_VIEW, linkId);

      pageTitleElement.textContent = pageTitles[linkId] || "";

      if (linkId === "link-portfolios") {
        const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        ui_renderPortfolioList(saved);
        breadcrumb_update("Overview", "Portfolios");
      } else if (linkId === "link-watchlist") {
        ui_renderWatchlist();
        breadcrumb_update("Overview", "Watchlist");
      } else if (linkId === "link-trending") {
        ui_renderTrending();
        breadcrumb_update("Overview", "Trending Stocks");
      } else if (linkId === "link-market") {
        // FIXED MARKET ROUTE
        ui_showView("view-market");
        ui_setActiveLink("link-market");
        pageTitleElement.textContent = "Market";
        breadcrumb_update("Overview", "Market");

        // Render heatmap only
        ui_renderHeatmap();
      } else if (linkId === "link-fraud") {
        ui_showView("view-fraud");
        ui_setActiveLink("link-fraud");
        pageTitleElement.textContent = "Fraud Analytics";

        // Fetch & render KPIs
        ui_renderFraudStats();
        ui_renderFraudDistribution();
        ui_renderGeoHeatmap();
        ui_renderFraudRules();
        ui_renderFraudCases(1);

        // (Later in Phase 2)
        //
        // ui_renderFraudGeoHeatmap();
        // ui_renderRuleEngine();

        breadcrumb_update("Overview", "Fraud Analytics");
      } else {
        breadcrumb_update(null);
      }
    });
  });

  // Overview parent toggle (desktop)
  if (overviewToggle) {
    overviewToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = overviewToggle.getAttribute("aria-expanded") === "true";
      const newState = !isOpen;

      overviewToggle.setAttribute("aria-expanded", newState);
      overviewSubmenu?.classList.toggle("hidden", !newState);

      if (newState) {
        ui_setActiveLink("link-overview");
        ui_showView("view-overview");
        pageTitleElement.textContent = "Portfolio Overview";
        breadcrumb_update(null);
      }
    });
  }

  // Portfolio submenu click
  const portfolioLink = document.getElementById("link-portfolios");
  if (portfolioLink) {
    portfolioLink.addEventListener("click", (e) => {
      e.preventDefault();
      ui_setActiveLink("link-portfolios");
      ui_showView("view-portfolios");
      pageTitleElement.textContent = pageTitles["link-portfolios"];
      const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
      ui_renderPortfolioList(saved);
      breadcrumb_update("Overview", "Portfolios");
    });
  }

  /* -------------------- MOBILE NAV -------------------- */

  const mobileMainMenuBtn = document.getElementById("mobile-mainmenu-btn");
  const mobileMgmtMenuBtn = document.getElementById("mobile-management-btn");
  const mobileMainMenuPanel = document.getElementById("mobile-mainmenu-panel");
  const mobileManagementPanel = document.getElementById(
    "mobile-management-panel"
  );
  const mobileOverlay = document.getElementById("mobile-overlay");
  const mobileOverviewToggle = document.getElementById(
    "mobile-overview-toggle"
  );
  const mobileOverviewSubmenu = document.getElementById(
    "mobile-overview-submenu"
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
  mobileOverlay?.addEventListener("click", mobile_closePanels);

  if (mobileOverviewToggle) {
    mobileOverviewToggle.addEventListener("click", () => {
      const open =
        mobileOverviewToggle.getAttribute("aria-expanded") === "true";
      mobileOverviewToggle.setAttribute("aria-expanded", !open);
      mobileOverviewSubmenu?.classList.toggle("hidden");
    });
  }

  // Mobile links call desktop logic
  document.querySelectorAll("[data-target-link]").forEach((mobileLink) => {
    mobileLink.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = mobileLink.dataset.targetLink;

      ui_setActiveLink(targetId);
      ui_showView(views[targetId]);
      pageTitleElement.textContent = pageTitles[targetId] || "";
      mobile_closePanels();

      if (targetId === "link-portfolios") {
        const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        ui_renderPortfolioList(saved);
        breadcrumb_update("Overview", "Portfolios");
      } else if (targetId === "link-market") {
        // FIXED MARKET ROUTE — MOBILE
        ui_showView("view-market");
        pageTitleElement.textContent = "Market";
        breadcrumb_update("Overview", "Market");
        ui_renderHeatmap();
      } else if (targetId === "link-overview") {
        breadcrumb_update(null);
      }
    });
  });

  /* ==========================================================================
     06. PROFILE DROPDOWN
     ========================================================================== */

  const profileToggle = document.getElementById("profile-menu-toggle");

  const profileDropdown = document.createElement("div");
  profileDropdown.id = "profileDropdown";
  profileDropdown.className =
    "hidden absolute top-16 right-4 w-56 bg-white shadow-lg border border-slate-200 rounded-lg p-4 animate-fade-in z-50";

  profileDropdown.innerHTML = `
    <div class="font-semibold text-slate-800">Loading...</div>
    <div class="text-sm text-slate-500 mb-3">Fetching user...</div>
  `;

  document.body.appendChild(profileDropdown);

  profileToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("hidden");
    mobile_closePanels();
  });

  document.addEventListener("click", () =>
    profileDropdown.classList.add("hidden")
  );

  /* ==========================================================================
     07. TABS SYSTEM (Overview Page)
     ========================================================================== */

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabContents.forEach((c) => c.classList.add("hidden"));
      document.getElementById(btn.dataset.target).classList.remove("hidden");
    });
  });

  /* ==========================================================================
     08. PREMIUM FEATURE HANDLING
     ========================================================================== */

  const premiumBtn = document.getElementById("premium-btn");
  const premiumBlock = document.getElementById("premium-block");
  const goldPrices = document.getElementById("gold-prices");
  const premiumBadge = document.getElementById("premium-badge");
  const featuresLink = document.getElementById("link-features");

  if (premiumBtn) {
    premiumBtn.addEventListener("click", () => {
      premiumBlock.style.display = "none";
      goldPrices.classList.remove("hidden");
      premiumBadge.classList.remove("hidden");

      featuresLink.querySelector("span.font-medium").textContent =
        "Premium Features (Active)";

      if (
        !document.getElementById("view-features").classList.contains("hidden")
      ) {
        pageTitleElement.textContent = "Premium Features (Active)";
      }
    });
  }

  /* ==========================================================================
     09. TOAST HANDLING
     ========================================================================== */

  setTimeout(() => {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.style.opacity = "0";
    toast.style.transition = "0.5s";
    setTimeout(() => (toast.style.display = "none"), 500);
  }, 5000);

  /* ==========================================================================
     10. REAL-TIME ENGINE (WebSockets)
     ========================================================================== */

  let socket = null;

  function realtime_initSocket() {
    if (!requireAuth()) return;

    socket = io(BASE_URL, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("WS Connected:", socket.id);
      showNotification("Real-time updates connected", false);
    });

    socket.on("portfolio_added", async (data) => {
      console.log("Real-time portfolio added:", data);
      showNotification(`New Portfolio Added: ${data.name}`);

      // Refresh the list IF user is currently viewing portfolios
      const active = sessionStorage.getItem("fg_current_view");
      if (active === "link-portfolios") {
        const page = Number(sessionStorage.getItem("fg_portfolio_page")) || 1;
        ui_renderPortfolioList(page);
      }
    });
    socket.on("holding_addedTO_portfolio", async (data) => {
      showNotification(`New Holding Added: ${data.symbol}`);

      const currentId = Number(
        sessionStorage.getItem("fg_current_portfolio_id")
      );
      const currentName = sessionStorage.getItem("fg_current_portfolio_name");

      if (currentId === Number(data.portfolio_id)) {
        ui_renderHoldings(currentId, currentName, 1);
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

      ui_renderHoldings(portfolioId, portfolioName, 1); // update avg + qty
    });
    socket.on("ticker_update", (list) => {
      list.forEach((t) => {
        const el = document.getElementById(`wl-${t.symbol}`);
        if (el) el.textContent = `Last: ₹${t.price.toFixed(2)}`;

        const liveBox = document.getElementById(`live-${t.symbol}`);
        if (liveBox) {
          liveBox.innerHTML = `
        <div class="font-semibold">₹${t.price.toFixed(2)}</div>
      `;
        }
      });
    });
    socket.on("fraud_alert", (data) => {
      showNotification(`Fraud Alert! Score: ${data.fraud_score}`);
      showFraudLiveAlert(msg);
      ui_renderFraudStats(); // Update KPIs
      ui_renderFraudDistribution(); // Update histogram
      ui_renderGeoHeatmap(); // Update map if affected
      ui_renderFraudCases(1);
    });
    socket.on("disconnect", () => {
      showNotification("Connection lost. Trying to reconnect…", true);
    });

    // Future socket listeners can be added here
  }

  /* ==========================================================================
     11. BACKEND INTEGRATION & PORTFOLIO UI
     ========================================================================== */

  // persist current portfolio page
  function savePortfolioPage(page) {
    sessionStorage.setItem(STORE_PORTFOLIO_PAGE, String(page));
  }

  async function api_getPortfolios(page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/portfolio/list?page=${page}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    } catch (err) {
      apiError(err);
      throw err;
    }
  }

  async function api_getHoldings(portfolioId, page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/portfolio/holdings/${portfolioId}?page=${page}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.holding;
    } catch (err) {
      apiError(err);
      throw err;
    }
  }

  async function api_getHoldingTransactions(holdingId, page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/portfolio/holdings/${holdingId}/transactions?page=${page}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      apiError(err);
      throw err;
    }
  }

  async function api_addWatchlist(symbol) {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/user/watchlist/add`,
        { symbol },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  async function api_getWatchlist(page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/watchlist/list?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return { items: [], pagination: {} };
    }
  }

  async function api_removeWatchlist(symbol) {
    try {
      const res = await axios.delete(
        `${BASE_URL}/api/user/watchlist/remove/${symbol}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }
  async function api_getHeatmap() {
    try {
      const r = await axios.get(`${BASE_URL}/api/user/market/heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.data.items;
    } catch (err) {
      apiError(err);
      return [];
    }
  }

  async function api_getNews(symbol) {
    try {
      const r = await axios.get(`${BASE_URL}/api/user/market/news/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.data.headlines;
    } catch (err) {
      apiError(err);
      return [];
    }
  }
  async function ui_testFraudScore(payload) {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/user/fraud/score`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }
  async function api_getFraudStats() {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/fraud/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }
  async function api_getFraudScores() {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/fraud/scores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.scores || [];
    } catch (err) {
      apiError(err);
      return [];
    }
  }
  async function api_getGeoRisk() {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/fraud/geo-risk`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data || {};
    } catch (err) {
      apiError(err);
      return {};
    }
  }
  async function api_getFraudRules() {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/fraud/rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.rules || [];
    } catch (err) {
      apiError(err);
      return [];
    }
  }
  async function ui_renderFraudRules(rulesOverride = null) {
    const tbody = document.getElementById("fraud-rules-body");
    if (!tbody) return;

    tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center py-6 text-slate-500">
        Loading...
      </td>
    </tr>
  `;

    const rules = rulesOverride || (await api_getFraudRules());

    if (!rules.length) {
      tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-6 text-slate-500">
          No rule engine data found.
        </td>
      </tr>
    `;
      return;
    }

    tbody.innerHTML = "";

    rules.forEach((r) => {
      const color =
        r.precision >= 90
          ? "text-emerald-600"
          : r.precision >= 70
          ? "text-amber-600"
          : "text-rose-500";

      const badge =
        r.status === "Active"
          ? "bg-emerald-100 text-emerald-700"
          : r.status === "Monitoring"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-200 text-slate-600";

      tbody.innerHTML += `
      <tr>
        <td class="px-4 sm:px-6 py-3 text-slate-700 font-medium">
          ${r.rule_name}
        </td>

        <td class="px-4 sm:px-6 py-3 text-slate-600">
          ${r.trigger_count}
        </td>

        <td class="px-4 sm:px-6 py-3 ${color} font-bold">
          ${r.precision}% 
        </td>

        <td class="px-4 sm:px-6 py-3">
          <span class="${badge} px-2 py-0.5 rounded-full text-xs font-bold">
            ${r.status}
          </span>
        </td>
      </tr>
    `;
    });
  }
  async function api_getFraudCases(page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/fraud/cases?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return { cases: [], pagination: {} };
    }
  }
  async function ui_renderFraudCases(page = 1) {
    const tbody = document.getElementById("fraud-cases-body");
    const empty = document.getElementById("fraud-cases-empty");
    const pagEl = document.getElementById("fraud-cases-pagination");

    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>`;
    pagEl.innerHTML = "";

    const { cases, pagination } = await api_getFraudCases(page);

    if (!cases.length) {
      empty.classList.remove("hidden");
      tbody.innerHTML = "";
      return;
    }

    empty.classList.add("hidden");
    tbody.innerHTML = "";

    cases.forEach((c) => {
      tbody.innerHTML += `
      <tr class="border hover:bg-slate-50 cursor-pointer" data-id="${c.id}">
        <td class="p-2">${c.id}</td>
        <td class="p-2 font-bold text-red-600">${(c.score * 100).toFixed(
          1
        )}%</td>
        <td class="p-2">${c.reason}</td>
        <td class="p-2">${new Date(c.createdAt).toLocaleString()}</td>
      </tr>
    `;
    });

    // Pagination
    const prev = pagination.prev;
    const next = pagination.next;
    const total = pagination.totalPages || 1;

    pagEl.innerHTML = `
    <button data-page="${prev || ""}"
      class="px-4 py-2 border rounded ${
        !prev ? "opacity-40 cursor-not-allowed" : ""
      }">
      ← Prev
    </button>

    <span class="px-4 py-2">Page ${pagination.page || 1} of ${total}</span>

    <button data-page="${next || ""}"
      class="px-4 py-2 border rounded ${
        !next ? "opacity-40 cursor-not-allowed" : ""
      }">
      Next →
    </button>
  `;

    // Attach pagination handlers
    pagEl.querySelectorAll("button[data-page]").forEach((btn) => {
      const p = btn.dataset.page;
      if (p)
        btn.addEventListener("click", () => ui_renderFraudCases(Number(p)));
    });
  }

  // ===========================================
  // MARKET MINI CHART
  // ===========================================
  let marketChart = null;

  async function renderMarketMiniChart(symbol) {
    const canvas = document.getElementById("market-mini-chart");

    const data = await api_getMarketHistory(symbol);
    if (!data) return;

    const prices = data.map((p) => p.price);
    const times = data.map((p) => p.time);

    if (marketChart) marketChart.destroy();

    marketChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: times,
        datasets: [
          {
            data: prices,
            borderWidth: 2,
            fill: false,
            tension: 0.2,
          },
        ],
      },
    });
  }

  async function ui_renderPortfolioList(page = 1) {
    const data = await api_getPortfolios(page);
    const portfolios = data.portfolios || [];
    const pagination = data.pagination || {}; // expects { page, totalPages, prev, next }

    // Save current page for reload persistence
    const currentPage = Number(pagination.page) || Number(page) || 1;
    savePortfolioPage(currentPage);

    const listEl = document.getElementById("portfolio-list");
    const pagEl = document.getElementById("portfolio-pagination");

    if (!listEl || !pagEl) return;

    listEl.innerHTML = "";

    portfolios.forEach((p) => {
      listEl.innerHTML += `
    <div class="portfolio-item border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
         data-id="${p.id}" data-name="${escapeHtml(p.name)}">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-bold text-slate-800">${escapeHtml(p.name)}</div>
          <div class="text-sm text-slate-500 mt-1">${escapeHtml(
            p.description || "No description"
          )}</div>
        </div>
        <button class="text-blue-600 underline text-sm">View Holdings</button>
      </div>
    </div>
  `;
    });

    document.querySelectorAll(".portfolio-item").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const name = card.dataset.name;
        sessionStorage.setItem("fg_current_portfolio_id", id);
        sessionStorage.setItem("fg_current_portfolio_name", name);
        ui_renderHoldings(id, name, 1);
      });
    });

    // Safe defaults
    const totalPages = Number(pagination.totalPages) || 1;
    const prevPage = pagination.prev || null;
    const nextPage = pagination.next || null;

    pagEl.innerHTML = `
      <button data-page="${prevPage || ""}" 
        class="px-4 py-2 border rounded text-sm ${
          !prevPage ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
        }">
        ← Prev
      </button>
      <span class="px-4 py-2 text-sm font-medium">Page ${currentPage} of ${totalPages}</span>
      <button data-page="${nextPage || ""}" 
        class="px-4 py-2 border rounded text-sm ${
          !nextPage ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
        }">
        Next →
      </button>
    `;

    // Attach click handlers
    pagEl.querySelectorAll("button[data-page]").forEach((btn) => {
      const pageNum = btn.dataset.page;
      if (pageNum) {
        btn.disabled = false;
        btn.addEventListener("click", () => {
          ui_renderPortfolioList(Number(pageNum));
        });
      } else {
        btn.disabled = true;
      }
    });
  }

  async function ui_renderHoldings(portfolioId, portfolioName, page = 1) {
    // Save active portfolio context
    sessionStorage.setItem("fg_current_portfolio_id", portfolioId);
    sessionStorage.setItem("fg_current_portfolio_name", portfolioName);

    ui_showView("view-holdings");

    document.getElementById(
      "holdings-title"
    ).textContent = `Holdings: ${portfolioName}`;

    const data = await api_getHoldings(portfolioId, page);

    const holdings = data.holdings || [];
    const pagination = data.pagination || {};

    const listEl = document.getElementById("holdings-list");
    const pagEl = document.getElementById("holdings-pagination");

    listEl.innerHTML = "";

    /* ----------------------------------------------------------------------
     NO HOLDINGS — SHOW EMPTY STATE
  ---------------------------------------------------------------------- */
    if (holdings.length === 0) {
      listEl.innerHTML = `
      <div class="text-center py-6 text-slate-500">
        No holdings found.
      </div>`;
    } else {
      /* ----------------------------------------------------------------------
       RENDER HOLDING CARDS (STATIC – NO LIVE MARKET DATA)
    ---------------------------------------------------------------------- */
      holdings.forEach((h) => {
        listEl.innerHTML += `
        <div class="holding-card border border-slate-200 rounded p-3 cursor-pointer"
             data-id="${h.id}"
             data-symbol="${h.symbol}">
             
          <div class="flex justify-between items-center">
            <div>
              <div class="font-bold text-slate-800">${h.symbol}</div>
              <div class="text-sm text-slate-600 mt-1">
                Qty: ${h.quantity} • Avg: ₹${h.avg_price}
              </div>
            </div>

            <button class="add-to-watchlist text-yellow-500"
                    data-symbol="${h.symbol}">
              ★
            </button>
          </div>
        </div>
      `;
      });

      /* ----------------------------------------------------------------------
       WATCHLIST BUTTON HANDLERS
    ---------------------------------------------------------------------- */
      document.querySelectorAll(".add-to-watchlist").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation(); // prevent opening transactions
          const symbol = btn.dataset.symbol;

          const res = await api_addWatchlist(symbol);
          if (res) ui_renderWatchlist();
        });
      });
    }

    /* ----------------------------------------------------------------------
     CLICK → OPEN TRANSACTIONS PAGE FOR HOLDING
  ---------------------------------------------------------------------- */
    document.querySelectorAll(".holding-card").forEach((card) => {
      card.addEventListener("click", () => {
        const holdingId = card.dataset.id;
        const symbol = card.dataset.symbol;

        sessionStorage.setItem("fg_current_holding_id", holdingId);
        sessionStorage.setItem("fg_current_holding_symbol", symbol);

        ui_renderHoldingTransactions(holdingId, symbol, 1);
      });
    });

    /* ----------------------------------------------------------------------
     PAGINATION RENDERING
  ---------------------------------------------------------------------- */
    const totalPages = Number(pagination.totalPages) || 1;
    const prev = pagination.prev || null;
    const next = pagination.next || null;

    pagEl.innerHTML = `
    <button data-page="${prev || ""}"
      class="px-3 py-1 border rounded text-sm
      ${!prev ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"}">
      ← Prev
    </button>

    <span class="px-4 text-sm font-medium">
      Page ${pagination.page || 1} of ${totalPages}
    </span>

    <button data-page="${next || ""}"
      class="px-3 py-1 border rounded text-sm
      ${!next ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"}">
      Next →
    </button>
  `;

    /* ----------------------------------------------------------------------
     PAGINATION CLICK HANDLERS
  ---------------------------------------------------------------------- */
    pagEl.querySelectorAll("button[data-page]").forEach((btn) => {
      const pageNum = btn.dataset.page;
      if (pageNum) {
        btn.addEventListener("click", () => {
          ui_renderHoldings(portfolioId, portfolioName, Number(pageNum));
        });
      }
    });
  }

  async function ui_renderWatchlist(page = 1) {
    ui_showView("view-watchlist");
    ui_setActiveLink("link-watchlist");

    const data = await api_getWatchlist(page);

    const items = data.items || [];
    const pagination = data.pagination || {};

    const listEl = document.getElementById("watchlist-items");
    const emptyEl = document.getElementById("watchlist-empty");
    const pagEl = document.getElementById("watchlist-pagination");

    listEl.innerHTML = "";
    pagEl.innerHTML = "";

    if (items.length === 0) {
      emptyEl.classList.remove("hidden");
      return;
    }

    emptyEl.classList.add("hidden");

    items.forEach((w) => {
      listEl.innerHTML += `
      <div 
        class="watchlist-card border border-slate-200 p-4 rounded-lg flex justify-between items-center"
        data-symbol="${w.symbol}"
      >
        <div>
          <div class="text-lg font-bold text-slate-800">${w.symbol}</div>
          <div class="text-sm text-slate-500" id="wl-${w.symbol}">
            Loading...
          </div>
        </div>

        <div class="flex gap-3">
          <button class="explore-market-btn text-blue-600 underline text-sm">
            Explore
          </button>

          <button class="remove-watch text-red-600 underline text-sm">
            Remove
          </button>
        </div>
      </div>
    `;
    });

    // Live market data load
    items.forEach(async (w) => {
      const q = await api_getMarketQuote(w.symbol);
      if (!q) return;

      const el = document.getElementById(`wl-${w.symbol}`);
      el.textContent = `Last: ₹${q.price}`;
    });

    // Click → Explore Market Panel
    document.querySelectorAll(".explore-market-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const symbol = btn.closest(".watchlist-card").dataset.symbol;
        openMarketPanel(symbol);
      });
    });

    // Remove from watchlist
    document.querySelectorAll(".remove-watch").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const symbol = btn.parentElement.parentElement.dataset.symbol;

        await api_removeWatchlist(symbol);
        ui_renderWatchlist(page);
        showNotification(`${symbol} removed from watchlist`);
      });
    });

    // Pagination
    const totalPages = pagination.totalPages || 1;
    const prev = pagination.prev;
    const next = pagination.next;

    pagEl.innerHTML = `
    <button data-page="${prev || ""}"
      class="px-3 py-1 border rounded text-sm ${
        !prev ? "opacity-40 cursor-not-allowed" : ""
      }">
      ← Prev
    </button>
    <span class="px-4 text-sm">Page ${
      pagination.page || 1
    } of ${totalPages}</span>
    <button data-page="${next || ""}"
      class="px-3 py-1 border rounded text-sm ${
        !next ? "opacity-40 cursor-not-allowed" : ""
      }">
      Next →
    </button>
  `;

    pagEl.querySelectorAll("button[data-page]").forEach((btn) => {
      const p = btn.dataset.page;
      if (p) {
        btn.addEventListener("click", () => ui_renderWatchlist(Number(p)));
      }
    });
  }

  async function openMarketPanel(symbol) {
    const panel = document.getElementById("market-panel");
    const titleEl = document.getElementById("market-title");
    const priceEl = document.getElementById("market-live-price");
    const extraEl = document.getElementById("market-extra");

    titleEl.textContent = symbol;

    panel.classList.remove("hidden");

    const q = await api_getMarketQuote(symbol);
    if (!q) {
      priceEl.textContent = "Failed to load";
      return;
    }

    priceEl.textContent = `₹${q.price}`;
    const changeColor = q.change >= 0 ? "text-green-600" : "text-red-600";

    extraEl.innerHTML = `
  <div>Change: <span class="${changeColor}">${
      q.change >= 0 ? "+" : ""
    }${q.change.toFixed(2)} (${
      q.change_percent >= 0 ? "+" : ""
    }${q.change_percent.toFixed(2)}%)</span></div>
  <div>Open: ₹${q.open.toFixed(2)}</div>
  <div>High: ₹${q.high.toFixed(2)}</div>
  <div>Low: ₹${q.low.toFixed(2)}</div>
  <div>Prev Close: ₹${q.prevClose.toFixed(2)}</div>
`;
    sessionStorage.setItem("fg_current_market_symbol", symbol);

    renderMarketMiniChart(symbol);
  }

  async function ui_renderHoldingTransactions(holdingId, symbol, page = 1) {
    ui_showView("view-holding-transactions");

    document.getElementById(
      "holding-transactions-title"
    ).textContent = `Transactions: ${symbol}`;

    // Fetch holding-level transactions
    const data = await api_getHoldingTransactions(holdingId, page);
    const transactions = data.transactions || [];
    const pagination = data.pagination || {};

    transactionsListEl.innerHTML = "";

    if (transactions.length === 0) {
      transactionsListEl.innerHTML = `
      <div class="text-center text-slate-500 py-6">
        No transactions yet.
      </div>`;
    } else {
      transactions.forEach((t) => {
        transactionsListEl.innerHTML += `
        <div class="border border-slate-200 rounded p-3">
          <div class="flex justify-between">
            <div>
              <div class="font-bold text-slate-800">${t.txn_type}</div>
              <div class="text-sm text-slate-600">
                Qty: ${t.qty} @ ₹${t.price}
              </div>
            </div>
            <div class="text-sm text-slate-500">
              ${new Date(t.createdAt).toLocaleString()}
            </div>
          </div>
        </div>`;
      });
    }

    // Pagination
    const totalPages = pagination.totalPages || 1;
    const prev = pagination.prev;
    const next = pagination.next;

    transactionsPagEl.innerHTML = `
    <button data-page="${prev || ""}"
      class="px-3 py-1 border rounded text-sm ${
        !prev ? "opacity-40 cursor-not-allowed" : ""
      }">← Prev</button>

    <span class="px-4 text-sm">Page ${
      pagination.page || 1
    } of ${totalPages}</span>

    <button data-page="${next || ""}"
      class="px-3 py-1 border rounded text-sm ${
        !next ? "opacity-40 cursor-not-allowed" : ""
      }">Next →</button>
  `;

    transactionsPagEl.querySelectorAll("button[data-page]").forEach((btn) => {
      const pageNum = btn.dataset.page;
      if (pageNum) {
        btn.addEventListener("click", () => {
          ui_renderHoldingTransactions(holdingId, symbol, Number(pageNum));
        });
      }
    });
  }

  async function api_getTrending() {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/market/trending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      apiError(err);
      return { items: [] };
    }
  }

  async function ui_renderTrending() {
    ui_showView("view-trending");
    ui_setActiveLink("link-trending");

    const list = document.getElementById("trending-list");
    list.innerHTML = "";

    const data = await api_getTrending();
    const items = data.items || [];

    items.forEach((t) => {
      const color = t.change >= 0 ? "text-green-600" : "text-red-600";

      list.innerHTML += `
      <div class="border p-4 rounded-lg flex justify-between items-center hover:bg-slate-50 transition"
           data-symbol="${t.symbol}">
        <div>
          <div class="text-lg font-bold">${t.symbol}</div>
          <div class="text-sm text-slate-600">₹${t.price}</div>
        </div>

        <div class="${color} font-medium">${t.change}%</div>
      </div>
    `;
    });

    // Click → open market panel
    document
      .querySelectorAll("#trending-list div[data-symbol]")
      .forEach((div) => {
        div.addEventListener("click", () => {
          openMarketPanel(div.dataset.symbol);
        });
      });
  }
  async function api_getMarketQuote(symbol) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/market/quote/${symbol}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return { price: 0, change: 0, change_percent: 0, name: symbol };
    }
  }

  async function api_getMarketHistory(symbol) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/market/history/${symbol}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return null;
    }
  }

  async function ui_renderHeatmap() {
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

        <div class="news-tooltip hidden absolute top-full left-1/2 transform -translate-x-1/2 
                    mt-2 bg-white text-slate-800 text-xs p-2 rounded shadow-xl w-48 z-50">
          Loading...
        </div>
      </div>
    `;
    });

    // attach events
    attachHeatmapHover();
  }

  function attachHeatmapHover() {
    document.querySelectorAll(".heatmap-tile").forEach((tile) => {
      const symbol = tile.dataset.symbol;
      const tooltip = tile.querySelector(".news-tooltip");

      tile.addEventListener("mouseenter", async () => {
        tooltip.classList.remove("hidden");
        tooltip.innerHTML = "Loading...";

        const headlines = await api_getNews(symbol);

        if (headlines.length === 0) {
          tooltip.innerHTML = "No recent news.";
          return;
        }

        tooltip.innerHTML =
          `<div class='font-semibold'>${headlines[0]}</div>` +
          (headlines[1] ? `<div class='mt-1'>${headlines[1]}</div>` : "");
      });
      tile.addEventListener("dblclick", async () => {
        const res = await api_addWatchlist(symbol);
        if (res) ui_renderWatchlist();
      });

      tile.addEventListener("mouseleave", () => {
        tooltip.classList.add("hidden");
      });

      tile.addEventListener("click", () => openMarketPanel(symbol));
    });
  }
  async function ui_renderFraudStats() {
    const stats = await api_getFraudStats();
    if (!stats) return;

    document.getElementById("fraud-kpi-detection").textContent =
      stats.detection_rate.toFixed(2) + "%";

    document.getElementById("fraud-kpi-fp").textContent =
      stats.false_positive_rate.toFixed(2) + "%";

    document.getElementById("fraud-kpi-total").textContent = formatShort(
      stats.total_analyzed
    );

    document.getElementById("fraud-kpi-highrisk").textContent =
      stats.high_risk_users;
  }
  async function ui_renderFraudDistribution() {
    const scores = await api_getFraudScores();
    if (!scores.length) return;

    // Binning scores (0–1 range)
    const bins = new Array(10).fill(0);
    scores.forEach((s) => {
      let idx = Math.floor(s * 10);
      if (idx === 10) idx = 9;
      bins[idx]++;
    });

    const ctx = document.getElementById("fraudScoreChart");

    // Destroy previous chart if exists
    if (fraudScoreChartInstance) {
      fraudScoreChartInstance.destroy();
    }

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
            backgroundColor: "rgba(99, 102, 241, 0.6)",
            borderColor: "rgba(99, 102, 241, 1)",
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
  async function ui_renderGeoHeatmap() {
    const geoData = await api_getGeoRisk();
    if (!geoData || !geoData.countries) return;

    const ctx = document.getElementById("geoRiskMap");

    if (geoRiskMapInstance) geoRiskMapInstance.destroy();

    // Country codes + intensity
    const labels = Object.keys(geoData.countries);
    const values = Object.values(geoData.countries);

    geoRiskMapInstance = new Chart(ctx, {
      type: "choropleth",
      data: {
        labels,
        datasets: [
          {
            label: "Fraud Risk",
            data: labels.map((country, i) => ({
              feature: window.worldGeoJSON.features.find(
                (f) => f.properties.iso_a2 === country
              ),
              value: values[i],
            })),
            borderWidth: 1,
            borderColor: "#999",
          },
        ],
      },
      options: {
        showOutline: true,
        showGraticule: false,
        scales: {
          xy: { projection: "equalEarth" },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // simple HTML escape to avoid injection when inserting names/descriptions
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
     12. CREATE PORTFOLIO FORM + HANDLERS
     ========================================================================== */

  // Add New Portfolio button
  if (addNewPortfolioBtn) {
    addNewPortfolioBtn.addEventListener("click", (e) => {
      e.preventDefault();
      portfolioCreateForm.reset();
      ui_setActiveLink(null); // keep no sidebar highlight
      ui_showView("view-portfolio-create");
      pageTitleElement.textContent = "Create Portfolio";
      breadcrumb_update("Overview", "New Portfolio");
    });
  }
  //Add New Holding button
  if (addNewHoldingBtn) {
    addNewHoldingBtn.addEventListener("click", () => {
      addHoldingForm.reset();
      ui_showView("view-holding-create");
      pageTitleElement.textContent = "Add Holding";

      const name = sessionStorage.getItem("fg_current_portfolio_name");
      breadcrumb_update("Holdings", `Add to ${name}`);
    });
  }
  // Cancel create
  if (createPortfolioCancel) {
    createPortfolioCancel.addEventListener("click", (e) => {
      e.preventDefault();
      ui_setActiveLink("link-portfolios");
      ui_showView("view-portfolios");
      pageTitleElement.textContent = pageTitles["link-portfolios"];
      const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
      ui_renderPortfolioList(saved);
      breadcrumb_update("Overview", "Portfolios");
    });
  }
  // Cancel holding create
  if (createHoldingCancel) {
    createHoldingCancel.addEventListener("click", () => {
      ui_showView("view-holdings");
      pageTitleElement.textContent = "Holdings";

      const id = sessionStorage.getItem("fg_current_portfolio_id");
      const name = sessionStorage.getItem("fg_current_portfolio_name");

      ui_renderHoldings(id, name, 1);
    });
  }
  //close market panel
  const closeMarketPanelBtn = document.getElementById("closeMarketPanel");
  if (closeMarketPanelBtn) {
    closeMarketPanelBtn.addEventListener("click", () => {
      document.getElementById("market-panel").classList.add("hidden");
    });
  }
  // Submit portfolio form
  if (portfolioCreateForm) {
    portfolioCreateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameEl = document.getElementById("portfolioName");
      const descEl = document.getElementById("portfolioDescription");
      const name = nameEl?.value?.trim();
      const description = descEl?.value?.trim();

      if (!name) {
        alert("Portfolio name is required.");
        return;
      }

      try {
        await api_createPortfolio({ name, description });
        portfolioCreateForm.reset();
        ui_setActiveLink("link-portfolios");
        ui_showView("view-portfolios");
        pageTitleElement.textContent = pageTitles["link-portfolios"];
        breadcrumb_update("Overview", "Portfolios");
        // refresh list (try to keep current page)
        const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        ui_renderPortfolioList(saved);
      } catch (err) {
        // handled by api_createPortfolio + apiError
      }
    });
  }
  //back button
  const backBtn = document.getElementById("backToPortfolios");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      ui_setActiveLink("link-portfolios");
      ui_showView("view-portfolios");
      const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
      ui_renderPortfolioList(saved);
    });
  }
  //Submit holding form
  const addHoldingForm = document.getElementById("addHoldingForm");
  if (addHoldingForm) {
    addHoldingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const symbol = document.getElementById("holdingSymbol").value.trim();
      const quantity = Number(document.getElementById("holdingQty").value);
      const avg_price = Number(
        document.getElementById("holdingAvgPrice").value
      );

      const portfolioId = sessionStorage.getItem("fg_current_portfolio_id");
      const portfolioName = sessionStorage.getItem("fg_current_portfolio_name");

      if (!portfolioId) {
        alert("Invalid portfolio");
        return;
      }

      try {
        await api_addHolding({
          portfolioId,
          symbol,
          quantity,
          avg_price,
        });

        addHoldingForm.reset();

        // Refresh holdings after adding
        ui_showView("view-holdings");
        ui_renderHoldings(portfolioId, portfolioName, 1);
        showNotification("Holding added successfully");
      } catch (err) {
        alert("Error adding holding");
      }
    });
  }

  if (addTransactionForm) {
    addTransactionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const holdingId = sessionStorage.getItem("fg_current_holding_id");
      const symbol = sessionStorage.getItem("fg_current_holding_symbol");

      const qty = Number(document.getElementById("txnQty").value);
      const price = Number(document.getElementById("txnPrice").value);
      const txn_type = document.getElementById("txnType").value;

      if (!holdingId) {
        return alert("Error: No holding selected.");
      }

      try {
        await api_addTransaction({
          holdingId,
          symbol,
          qty,
          price,
          txn_type,
        });

        addTransactionForm.reset();

        const portfolioId = sessionStorage.getItem("fg_current_portfolio_id");
        const portfolioName = sessionStorage.getItem(
          "fg_current_portfolio_name"
        );

        ui_renderHoldingTransactions(holdingId, symbol, 1);
        ui_renderHoldings(portfolioId, portfolioName, 1);

        showNotification("Transaction added successfully");
      } catch (err) {
        apiError(err);
        alert("Failed to add transaction");
      }
    });
  }

  if (backToHoldings) {
    backToHoldings.addEventListener("click", () => {
      const id = sessionStorage.getItem("fg_current_portfolio_id");
      const name = sessionStorage.getItem("fg_current_portfolio_name");

      ui_renderHoldings(id, name, 1);
    });
  }
  const marketBtn = document.getElementById("marketSearchBtn");

  if (marketBtn) {
    marketBtn.addEventListener("click", async () => {
      const symbol = document.getElementById("marketSearch").value.trim();
      if (!symbol) return;

      const data = await api_getMarketQuote(symbol);
      if (!data) return;

      const box = document.getElementById("marketResult");
      box.innerHTML = `
      <div class="text-lg font-bold">${data.name} (${data.symbol})</div>
      <div class="text-2xl font-semibold mt-2">₹${data.price}</div>

      <div class="${data.change >= 0 ? "text-green-600" : "text-red-600"} mt-1">
        ${data.change.toFixed(2)} (${data.change_percent.toFixed(2)}%)
      </div>

      <div class="text-sm text-slate-600 mt-3">
        High: ₹${data.high} • Low: ₹${data.low} • Vol: ${data.volume}
      </div>
    `;
      box.classList.remove("hidden");
    });
  }

  const refreshWatchlistBtn = document.getElementById("refreshWatchlistBtn");
  if (refreshWatchlistBtn) {
    refreshWatchlistBtn.addEventListener("click", () => {
      ui_renderWatchlist(1);
    });
  }

  const refreshTrendingBtn = document.getElementById("refreshTrendingBtn");
  if (refreshTrendingBtn) {
    refreshTrendingBtn.addEventListener("click", () => ui_renderTrending());
  }
  document
    .getElementById("addToWatchlistBtn")
    .addEventListener("click", async () => {
      const symbol = sessionStorage.getItem("fg_current_market_symbol");
      if (!symbol) return;

      const res = await api_addWatchlist(symbol);
      if (res) {
        ui_renderWatchlist(); // refresh UI
        alert(`${symbol} added to watchlist`);
      }
    });
  const fraudTestForm = document.getElementById("fraudTestForm");
  if (fraudTestForm) {
    fraudTestForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = Object.fromEntries(
        new FormData(fraudTestForm).entries()
      );
      const result = await ui_testFraudScore(formData);

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

  /* ==========================================================================
     13. BREADCRUMB HANDLERS
     ========================================================================== */

  if (breadcrumbRoot) {
    breadcrumbRoot.addEventListener("click", (e) => {
      e.preventDefault();
      // collapse submenu if open
      const _overviewSubmenu = document.getElementById("overview-submenu");
      const _overviewToggle = document.getElementById("link-overview-toggle");
      if (_overviewSubmenu && !_overviewSubmenu.classList.contains("hidden")) {
        _overviewSubmenu.classList.add("hidden");
        _overviewToggle?.setAttribute("aria-expanded", "false");
      }

      ui_setActiveLink("link-overview");
      ui_showView("view-overview");
      pageTitleElement.textContent = "Portfolio Overview";
      breadcrumb_update(null);
    });
  }

  /* ==========================================================================
     14. MAIN INITIALIZER
     ========================================================================== */

  async function initUserConsole() {
    console.log("=== INIT START ===");
    await user_loadProfile();
    realtime_initSocket();
    const storedLinkId = sessionStorage.getItem(STORE_CURRENT_VIEW);

    if (storedLinkId && views[storedLinkId]) {
      ui_setActiveLink(storedLinkId);
      ui_showView(views[storedLinkId]); // ← this will trigger the log above
      pageTitleElement.textContent = pageTitles[storedLinkId] || "Dashboard";
      if (storedLinkId === "link-portfolios") {
        ui_renderPortfolioList(1);
        breadcrumb_update("Overview", "Portfolios");
      } else {
        breadcrumb_update(null);
      }
    } else {
      ui_setActiveLink("link-overview");
      ui_showView("view-overview");
      pageTitleElement.textContent = "Portfolio Overview";
      breadcrumb_update(null);
      sessionStorage.setItem(STORE_CURRENT_VIEW, "link-overview");
    }

    console.log("=== INIT END ===");
  }

  initUserConsole();
});
