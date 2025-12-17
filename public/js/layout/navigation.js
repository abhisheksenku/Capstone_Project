/* ============================================================================
   FIN-GUARD NAVIGATION
   Sidebar, mobile menu, view switching, state restore
============================================================================ */

import { STORE_CURRENT_VIEW } from "../core/state.js";

/* ===================== DOM REFERENCES ===================== */

const sidebarLinks = document.querySelectorAll(".sidebar-link");
const viewSections = document.querySelectorAll(".view-section");

// Mobile buttons
const mobileMainMenuBtn = document.getElementById("mobile-mainmenu-btn");
const mobileManagementBtn = document.getElementById("mobile-management-btn");

// Sidebar
const sidebar = document.getElementById("sidebar");

// Overview submenu
const overviewToggleBtn = document.getElementById("link-overview-toggle");
const overviewSubmenu = document.getElementById("overview-submenu");

/* ===================== VIEW HELPERS ===================== */

function showView(viewId, persist = true) {
  console.log("[NAV] showView called with:", viewId);
  // Hide all views
  viewSections.forEach((v) => v.classList.add("hidden"));

  const target = document.getElementById(viewId);
  if (!target) {
    console.warn("[NAV] View not found:", viewId);
    return;
  }

  // Show selected view
  target.classList.remove("hidden");

  // Persist state
  if (persist) {
    sessionStorage.setItem(STORE_CURRENT_VIEW, viewId);
  }

  console.log("[NAV] dispatching view:change for", viewId);
  // 🔔 CRITICAL: Notify all modules of view change
  document.dispatchEvent(
    new CustomEvent("view:change", {
      detail: { viewId },
    })
  );
}

function setActiveLink(linkId) {
  sidebarLinks.forEach((l) => l.classList.remove("active"));
  const link = document.getElementById(linkId);
  if (link) link.classList.add("active");
}

/* ===================== SIDEBAR NAVIGATION ===================== */

function initSidebarLinks() {
  sidebarLinks.forEach((link) => {
    const view = link.dataset.view;

    link.addEventListener("click", (e) => {
      e.preventDefault();

      if (!view) {
        console.warn("[NAV] data-view missing on", link.id);
        return;
      }

      const viewId = `view-${view}`;

      showView(viewId);
      setActiveLink(link.id);
    });
  });
}

/* ===================== OVERVIEW SUBMENU ===================== */

function initOverviewToggle() {
  if (!overviewToggleBtn || !overviewSubmenu) return;

  overviewToggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    overviewSubmenu.classList.toggle("hidden");
  });
}

/* ===================== MOBILE NAVIGATION ===================== */

function initMobileNav() {
  if (mobileMainMenuBtn && sidebar) {
    mobileMainMenuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
    });
  }

  if (mobileManagementBtn && sidebar) {
    mobileManagementBtn.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
    });
  }
}

/* ===================== RESTORE LAST VIEW ===================== */

function restoreLastView() {
  const storedView = sessionStorage.getItem(STORE_CURRENT_VIEW);
  console.log("[NAV] restoreLastView called, storedView =", storedView);
  if (!storedView) return false;

  showView(storedView, false);

  sidebarLinks.forEach((link) => {
    const view = link.dataset.view;
    if (`view-${view}` === storedView) {
      setActiveLink(link.id);
    }
  });

  return true;
}

/* ===================== INIT ===================== */

function initNavigation() {
  initSidebarLinks();
  initOverviewToggle();
  initMobileNav();
}

/* ===================== EXPORTS ===================== */

export {
  initNavigation,
  showView,
  setActiveLink,
  restoreLastView,
};
