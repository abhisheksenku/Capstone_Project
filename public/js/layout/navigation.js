/* ============================================================================
   FIN-GUARD NAVIGATION
   Single source of truth for view switching + restore
============================================================================ */

import { STORE_CURRENT_VIEW } from "../core/state.js";

/* ===================== DOM REFERENCES ===================== */

const sidebarLinks = document.querySelectorAll(".sidebar-link");
const viewSections = document.querySelectorAll(".view-section");

const sidebar = document.getElementById("sidebar");
const mobileMainMenuBtn = document.getElementById("mobile-mainmenu-btn");
const mobileManagementBtn = document.getElementById("mobile-management-btn");

const overviewToggleBtn = document.getElementById("link-overview-toggle");
const overviewSubmenu = document.getElementById("overview-submenu");

/* ===================== INTERNAL STATE ===================== */

let activeViewId = null;

/* ===================== CORE ===================== */

function hideAllViews() {
  viewSections.forEach((v) => v.classList.add("hidden"));
}

function showView(viewId, persist = true) {
  if (!viewId) return;

  // Prevent duplicate view-change spam
  if (activeViewId === viewId) return;

  const target = document.getElementById(viewId);
  if (!target) {
    console.warn("[NAV] View not found:", viewId);
    return;
  }

  hideAllViews();
  target.classList.remove("hidden");

  activeViewId = viewId;

  if (persist) {
    sessionStorage.setItem(STORE_CURRENT_VIEW, viewId);
  }

  document.dispatchEvent(
    new CustomEvent("view:change", {
      detail: { viewId },
    })
  );
}

/* ===================== SIDEBAR ===================== */

function setActiveLink(linkId) {
  sidebarLinks.forEach((l) => l.classList.remove("active"));
  document.getElementById(linkId)?.classList.add("active");
}

function initSidebarLinks() {
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const view = link.dataset.view;
      if (!view) {
        console.warn("[NAV] data-view missing on:", link.id);
        return;
      }

      const viewId = `view-${view}`;
      showView(viewId, true);
      setActiveLink(link.id);
    });
  });
}

/* ===================== OVERVIEW TOGGLE ===================== */

function initOverviewToggle() {
  if (!overviewToggleBtn || !overviewSubmenu) return;

  overviewToggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    overviewSubmenu.classList.toggle("hidden");
  });
}

/* ===================== MOBILE ===================== */

function initMobileNav() {
  mobileMainMenuBtn?.addEventListener("click", () => {
    sidebar?.classList.toggle("hidden");
  });

  mobileManagementBtn?.addEventListener("click", () => {
    sidebar?.classList.toggle("hidden");
  });
}

/* ===================== RESTORE ===================== */

function restoreLastView() {
  const storedView = sessionStorage.getItem(STORE_CURRENT_VIEW);

  if (!storedView) return false;

  showView(storedView, false);

  // highlight sidebar link if it matches
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

  // Do restore here so app doesn't need to call restore separately
  if (!restoreLastView()) {
    showView("view-overview", true);
  }
}

export { initNavigation, showView, setActiveLink, restoreLastView };
