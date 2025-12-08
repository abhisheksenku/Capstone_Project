/* ============================================================================
   ADMIN PANEL FRONTEND SCRIPT  
   Handles navigation, sidebar, modals, profile menu, toggles, UI states
   NOTE: Pure UI functionality only. No backend API calls here.
============================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     SECTION 1: ELEMENT REFERENCES
  ========================================================================== */
  const links = document.querySelectorAll(".admin-link, .mobile-admin-link");
  const sections = document.querySelectorAll(".admin-section");

  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");

  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  const userModal = document.getElementById("userModal");
  const viewUserButtons = document.querySelectorAll(".view-user-btn");
  const closeUserModalButtons = document.querySelectorAll(
    "#closeUserModal, #closeUserModal2"
  );

  const impersonateBtn = document.getElementById("impersonateBtn");
  const impersonateUserBtns = document.querySelectorAll(
    ".impersonate-user-btn"
  );

  const forceLogoutBtn = document.getElementById("forceLogout");

  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  /* PROFILE ELEMENTS */
  const pmName = document.getElementById("pmName");
  const pmEmail = document.getElementById("pmEmail");

  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileAvatar = document.getElementById("profileAvatar");

  const pName = document.getElementById("pName");
  const pEmail = document.getElementById("pEmail");
  const pMobile = document.getElementById("pMobile");

  /* ==========================================================================
     SECTION 2: PAGE/SECTION NAVIGATION
     Handles navigation for Dashboard, Users, Rules, Analytics, etc.
  ========================================================================== */

  function hideAllSections() {
    sections.forEach((s) => s.classList.add("hidden"));
  }

  function setActiveLink(target) {
    document.querySelectorAll(".admin-link").forEach((btn) => {
      btn.classList.remove(
        "bg-slate-700",
        "text-white",
        "ring-2",
        "ring-blue-100"
      );
    });

    const activeBtn = Array.from(document.querySelectorAll(".admin-link")).find(
      (b) => b.dataset?.target === target
    );

    if (activeBtn) {
      activeBtn.classList.add("bg-slate-700", "text-white");
    }
  }

  // Navigation click events (Desktop + Mobile)
  links.forEach((l) =>
    l.addEventListener("click", () => {
      const target = l.getAttribute("data-target");

      hideAllSections();
      document.getElementById(target)?.classList.remove("hidden");

      setActiveLink(target);

      // Close mobile sidebar
      mobileSidebar.classList.add("-translate-x-full");

      window.scrollTo({ top: 0, behavior: "smooth" });
    })
  );

  // Default page → Dashboard
  hideAllSections();
  document.getElementById("dash").classList.remove("hidden");
  setActiveLink("dash");

  /* ==========================================================================
     SECTION 3: MOBILE SIDEBAR TOGGLE
  ========================================================================== */
  sidebarToggle?.addEventListener("click", () => {
    mobileSidebar.classList.toggle("-translate-x-full");
  });

  document.addEventListener("click", (e) => {
    if (
      !mobileSidebar.contains(e.target) &&
      !sidebarToggle.contains(e.target)
    ) {
      mobileSidebar.classList.add("-translate-x-full");
    }
  });

  /* ==========================================================================
     SECTION 4: PROFILE DROPDOWN MENU
  ========================================================================== */
  profileBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    profileMenu?.classList.add("hidden");
  });

  /* ==========================================================================
     SECTION 5: USER DETAIL MODAL
  ========================================================================== */

  // Open user modal
  viewUserButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      userModal.classList.remove("hidden");
      userModal.classList.add("flex");
    })
  );

  // Close modal (buttons)
  closeUserModalButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      userModal.classList.add("hidden");
      userModal.classList.remove("flex");
    })
  );

  // Close modal by clicking outside
  userModal?.addEventListener("click", (e) => {
    if (e.target === userModal) {
      userModal.classList.add("hidden");
      userModal.classList.remove("flex");
    }
  });

  /* ==========================================================================
     SECTION 6: DEMO BUTTONS (Impersonate / Logout)
  ========================================================================== */
  impersonateBtn?.addEventListener("click", () => {
    alert("Impersonation request (demo only).");
  });

  impersonateUserBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      alert("User impersonation started (demo only).");
    })
  );

  forceLogoutBtn?.addEventListener("click", () => {
    alert("Force logout triggered (demo only).");
  });

  /* ==========================================================================
     SECTION 7: FEATURE FLAGS (Demo Only)
  ========================================================================== */
  document.getElementById("flagRealtime")?.addEventListener("change", (e) => {
    alert("Realtime scoring toggled: " + (e.target.checked ? "ON" : "OFF"));
  });

  /* ==========================================================================
     SECTION 8: SYSTEM CONFIG — Save / Apply (Demo only)
  ========================================================================== */
  document.getElementById("saveSystemConfig")?.addEventListener("click", () => {
    const threshold = document.getElementById("thresholdInput").value;
    const model = document.getElementById("modelSelect").value;

    alert(
      `System config saved (demo): Model=${model}  Threshold=$${threshold}`
    );
  });

  document.getElementById("applyRuntime")?.addEventListener("click", () => {
    alert("Runtime settings applied (demo only).");
  });

  /* ==========================================================================
     SECTION 9: KEYBOARD SHORTCUTS
     "/" → Focus global search bar
  ========================================================================== */
  document.addEventListener("keydown", (e) => {
    if (e.key === "/") {
      document.getElementById("globalSearch")?.focus();
      e.preventDefault();
    }
  });
  /* ==========================================================================
   SECTION 9B: FETCH LOGGED-IN ADMIN PROFILE (Backend connected)
   Uses token stored in sessionStorage
========================================================================== */

  async function loadAdminProfile() {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${BASE_URL}/api/admin/fetch/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = res.data.user;

      // Populate Profile Menu
      pmName.textContent = user.name;
      pmEmail.textContent = user.email;

      // Populate Profile Section
      profileName.textContent = user.name;
      profileEmail.textContent = user.email;
      profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=0D8ABC&color=fff`;

      // Populate Form Inputs
      pName.value = user.name;
      pEmail.value = user.email;
      pMobile.value = user.phone;
    } catch (err) {
      console.error("Failed to load admin profile:", err);
    }
  }
  /* ==========================================================================
     SECTION 10: PROFILE SECTION OPEN (via Profile Menu)
  ========================================================================== */
  document.getElementById("openProfileBtn")?.addEventListener("click", () => {
    profileMenu.classList.add("hidden");

    hideAllSections();
    document.getElementById("profileSection").classList.remove("hidden");

    document.querySelectorAll(".admin-link").forEach((btn) => {
      btn.classList.remove("bg-slate-700", "text-white");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ==========================================================================
     SECTION 11: PROFILE EDIT / SAVE (UI Only)
  ========================================================================== */
  editBtn?.addEventListener("click", () => {
    document.querySelectorAll("#profileForm input").forEach((input) => {
      input.disabled = false;
      input.classList.remove("bg-slate-100");
    });

    editBtn.classList.add("hidden");
    saveBtn.classList.remove("hidden");
  });

  document.getElementById("profileForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    alert("Profile saved (demo only)");

    document.querySelectorAll("#profileForm input").forEach((input) => {
      input.disabled = true;
      input.classList.add("bg-slate-100");
    });

    saveBtn.classList.add("hidden");
    editBtn.classList.remove("hidden");
  });
  /* ==========================================================================
   SECTION 12 — WEB SOCKETS  
   Initializes socket connection for real-time updates
========================================================================== */

  let socket = null;

  function initSocket() {
    const token = sessionStorage.getItem("token");
    if (!token) {
      console.warn("Socket not initialized: No token found.");
      return;
    }

    socket = io(BASE_URL, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("WS connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("WS disconnected");
    });

    // Future event listeners:
    // socket.on("fraud-alert", handleFraudAlert);
    // socket.on("premium-update", updateLeaderboard);
    // socket.on("new-log", appendToLogTable);
  }

  /* ==========================================================================
   MAIN ADMIN INITIALIZER
   Runs once after DOMContentLoaded and loads all required data
========================================================================== */
  async function initAdminApp() {
    console.log("Initializing Admin Console...");

    // 1. Load profile (common, required everywhere)
    await loadAdminProfile();

    // 2. Load dashboard KPIs (later when backend ready)
    // await loadDashboardKPIs();

    // 3. Load admin users table
    // await loadUsersList();

    // 4. Load logs
    // await loadAuditLogs();

    // 5. Load feature flags
    // await loadFeatureFlags();
    initSocket();
    // More modules will be added over time
    console.log("Admin Console is ready.");
  }
  initAdminApp();
});
