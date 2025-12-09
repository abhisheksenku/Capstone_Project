/* ============================================================================
   FIN-GUARD USER DASHBOARD SCRIPT (FULLY REWRITTEN)
   Clean architecture • Refresh-safe routing • Proper comments • Production ready
============================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* --------------------------------------------------------------------------
     SECTION 1: SESSION + GLOBAL CONFIG
  -------------------------------------------------------------------------- */
  const token = sessionStorage.getItem("token");
  if (!token) return (window.location.href = "/login");

  const STORE_CURRENT_VIEW = "fg_current_view";
  const STORE_PORTFOLIO_PAGE = "fg_portfolio_page";

  const pageTitle = document.getElementById("page-title");

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  function apiError(err) {
    const msg = err?.response?.data?.message || err?.message || "API Error";
    console.error(msg);
    showNotification(msg, true);
  }

  function showNotification(message, isError = false) {
    const box = document.getElementById("toast");
    if (!box) return;

    box.classList.remove("hidden");
    box.style.backgroundColor = isError ? "#dc2626" : "#2563eb";
    box.textContent = message;

    setTimeout(() => {
      box.style.opacity = "0";
      setTimeout(() => {
        box.classList.add("hidden");
        box.style.opacity = "1";
      }, 400);
    }, 2500);
  }

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  /* --------------------------------------------------------------------------
     SECTION 2: VIEW ROUTING MAP
  -------------------------------------------------------------------------- */
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
    "link-features": "view-features"
  };

  const titles = {
    "link-overview": "Dashboard",
    "link-portfolios": "My Portfolios",
    "link-market": "Market",
    "link-watchlist": "Watchlist",
    "link-trending": "Trending Stocks",
    "link-fraud": "Fraud Analytics",
    "link-alerts": "Risk Alerts",
    "link-settings": "User Profile",
    "link-features": "Premium Features"
  };

  /* --------------------------------------------------------------------------
     SECTION 3: VIEW SHOW / HIDE + SAVE STATE
  -------------------------------------------------------------------------- */
  function ui_showView(viewId) {
    document.querySelectorAll(".view-section").forEach((v) => v.classList.add("hidden"));
    document.getElementById(viewId)?.classList.remove("hidden");

    // persist last opened view
    sessionStorage.setItem(STORE_CURRENT_VIEW, viewId);
  }

  const navLinks = document.querySelectorAll(".sidebar-link");

  function ui_setActive(linkId) {
    navLinks.forEach((l) => l.classList.remove("active"));
    if (linkId) document.getElementById(linkId)?.classList.add("active");
  }

  /* --------------------------------------------------------------------------
     SECTION 4: BREADCRUMB HANDLER
  -------------------------------------------------------------------------- */
  const crumbRoot = document.getElementById("breadcrumb-overview");
  const crumbDivider = document.getElementById("breadcrumb-divider");
  const crumbSub = document.getElementById("breadcrumb-sub");

  function updateBreadcrumb(main = null, sub = null) {
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

  crumbRoot.addEventListener("click", () => {
    ui_setActive("link-overview");
    ui_showView("view-overview");
    pageTitle.textContent = "Portfolio Overview";
    updateBreadcrumb(null);
  });

  /* --------------------------------------------------------------------------
     SECTION 5: SIDEBAR NAVIGATION (ALL LINKS)
  -------------------------------------------------------------------------- */
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const id = link.id;
      const viewId = views[id];

      ui_setActive(id);
      ui_showView(viewId);

      pageTitle.textContent = titles[id] || "";
      updateBreadcrumb("Overview", titles[id]);
    });
  });

  /* --------------------------------------------------------------------------
     SECTION 6: OVERVIEW COLLAPSIBLE MENU
  -------------------------------------------------------------------------- */
  const overviewToggle = document.getElementById("link-overview-toggle");
  const overviewSubmenu = document.getElementById("overview-submenu");

  if (overviewToggle) {
    overviewToggle.addEventListener("click", () => {
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

  /* --------------------------------------------------------------------------
     SECTION 7: PROFILE DROPDOWN + USER LOADER
  -------------------------------------------------------------------------- */
  const profileToggle = document.getElementById("profile-menu-toggle");

  const profileDropdown = document.createElement("div");
  profileDropdown.id = "profileDropdown";
  profileDropdown.className =
    "hidden absolute top-16 right-4 w-56 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-50";
  profileDropdown.innerHTML = `
    <div class="font-semibold text-slate-800 mb-1">Loading...</div>
    <div class="text-sm text-slate-500">Fetching user</div>
  `;
  document.body.appendChild(profileDropdown);

  profileToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", () => profileDropdown.classList.add("hidden"));

  async function user_loadProfile() {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/fetch/profile`, authHeaders);
      const user = res.data.user;
      if (!user) return;

      const headerName = document.querySelector("header .group .text-sm.font-semibold");
      const headerRole = document.querySelector("header .group .text-xs");

      if (headerName) headerName.textContent = user.name;
      if (headerRole) headerRole.textContent = user.role || "User";

      if (user.isPremium) document.getElementById("premium-badge")?.classList.remove("hidden");

      profileDropdown.innerHTML = `
        <div class="font-semibold text-slate-800">${user.name}</div>
        <div class="text-sm text-slate-500 mb-3">${user.email}</div>

        <button id="profileViewBtn"
          class="w-full bg-blue-600 text-white py-1.5 rounded-md text-sm hover:bg-blue-700 transition mb-2">
          View Profile
        </button>

        <button id="logoutBtn"
          class="w-full bg-red-600 text-white py-1.5 rounded-md text-sm hover:bg-red-700 transition">
          Logout
        </button>
      `;

      document.getElementById("profileViewBtn").onclick = () => {
        ui_setActive("link-settings");
        ui_showView("view-settings");
        pageTitle.textContent = titles["link-settings"];
        updateBreadcrumb("Overview", "User Profile");
      };

      document.getElementById("logoutBtn").onclick = () => {
        sessionStorage.removeItem("token");
        window.location.href = "/login";
      };
    } catch (err) {
      apiError(err);
    }
  }

  /* --------------------------------------------------------------------------
     SECTION 8: PORTFOLIO API HELPERS
  -------------------------------------------------------------------------- */
  const savePortfolioPage = (page) =>
    sessionStorage.setItem(STORE_PORTFOLIO_PAGE, String(page));

  async function api_getPortfolios(page = 1) {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/user/portfolio/list?page=${page}&limit=5`,
        authHeaders
      );
      return res.data;
    } catch (err) {
      apiError(err);
      return { portfolios: [], pagination: {} };
    }
  }

  async function api_createPortfolio(payload) {
    try {
      return (await axios.post(
        `${BASE_URL}/api/user/portfolio/create`,
        payload,
        authHeaders
      )).data;
    } catch (err) {
      apiError(err);
      throw err;
    }
  }

  /* --------------------------------------------------------------------------
     SECTION 9: PORTFOLIO LIST RENDERER
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
        <div class="text-center py-6 text-slate-500">No portfolios found.</div>
      `;
      return;
    }

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
            <button class="text-blue-600 underline text-sm">View Holdings</button>
          </div>
        </div>
      `;
    });

    document.querySelectorAll(".portfolio-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const name = card.dataset.name;
        sessionStorage.setItem("fg_current_portfolio_id", id);
        sessionStorage.setItem("fg_current_portfolio_name", name);
        ui_showView("view-holdings");
        pageTitle.textContent = name;
      });
    });

    const prev = pagination.prev || null;
    const next = pagination.next || null;
    const totalPages = pagination.totalPages || 1;

    pag.innerHTML = `
      <button data-page="${prev || ""}"
        class="px-4 py-2 border rounded text-sm ${
          !prev ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
        }">← Prev</button>

      <span class="px-4 py-2 text-sm font-medium">Page ${currentPage} of ${totalPages}</span>

      <button data-page="${next || ""}"
        class="px-4 py-2 border rounded text-sm ${
          !next ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
        }">Next →</button>
    `;

    pag.querySelectorAll("button[data-page]").forEach((btn) => {
      const p = btn.dataset.page;
      if (p) btn.addEventListener("click", () => ui_renderPortfolioList(Number(p)));
    });
  }

  /* --------------------------------------------------------------------------
     SECTION 10: CREATE PORTFOLIO HANDLERS
  -------------------------------------------------------------------------- */
  const addNewPortfolioBtn = document.getElementById("addNewPortfolioBtn");
  const portfolioCreateForm = document.getElementById("portfolioCreateForm");

  addNewPortfolioBtn?.addEventListener("click", () => {
    portfolioCreateForm?.reset();
    ui_setActive(null);
    ui_showView("view-portfolio-create");
    pageTitle.textContent = "Create Portfolio";
    updateBreadcrumb("Overview", "New Portfolio");
  });

  portfolioCreateForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("portfolioName").value.trim();
    const description = document.getElementById("portfolioDescription").value.trim();

    if (!name) return showNotification("Portfolio name required", true);

    await api_createPortfolio({ name, description });

    showNotification("Portfolio created successfully");
    ui_setActive("link-portfolios");
    ui_renderPortfolioList(1);
  });

  document.getElementById("createPortfolioCancel")?.addEventListener("click", () => {
    ui_setActive("link-portfolios");
    const saved = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
    ui_renderPortfolioList(saved);
  });

  /* --------------------------------------------------------------------------
     SECTION 11: INITIAL LOAD (RESTORE PREVIOUS PAGE)
  -------------------------------------------------------------------------- */
  async function initUserConsole() {
    await user_loadProfile();

    const savedView = sessionStorage.getItem(STORE_CURRENT_VIEW);

    if (savedView && document.getElementById(savedView)) {
      ui_showView(savedView);

      const activeLink = Object.keys(views).find((k) => views[k] === savedView);
      ui_setActive(activeLink);

      if (titles[activeLink]) {
        pageTitle.textContent = titles[activeLink];
        updateBreadcrumb("Overview", titles[activeLink]);
      } else {
        updateBreadcrumb(null);
      }

      if (savedView === "view-portfolios") {
        const pg = Number(sessionStorage.getItem(STORE_PORTFOLIO_PAGE)) || 1;
        return ui_renderPortfolioList(pg);
      }

      return;
    }

    // default
    ui_setActive("link-overview");
    ui_showView("view-overview");
    updateBreadcrumb(null);
  }

  initUserConsole();
});
