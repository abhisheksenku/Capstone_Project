/* ============================================================================
   FIN-GUARD PROFILE HANDLER
   - Header profile dropdown
   - User info rendering
   - Settings view population (API-driven)
   - Navigation-safe (uses showView ONLY)
============================================================================ */

/* ===================== IMPORTS ===================== */

import {
  api_getUserProfile,
  api_checkPremiumStatus,
} from "../core/api.js";

import { showToast } from "../core/helpers.js";
import { showView } from "../layout/navigation.js";

/* ===================== DOM REFERENCES ===================== */

// Dropdown
const profileToggle = document.getElementById("profile-menu-toggle");
const profileMenu = document.getElementById("profileMenu");

// Menu actions
const viewProfileBtn = document.getElementById("viewProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Header info
const profileNameEl = document.querySelector(".group .text-sm.font-semibold");
const profileRoleEl = document.querySelector(".group .text-xs.text-slate-500");
const premiumBadgeEls = document.querySelectorAll("#premium-badge");
const headerAvatarImg = document.getElementById("headerAvatar");

// Settings page fields
const settingsNameInput = document.getElementById("name");
const settingsEmailInput = document.getElementById("email");
const settingsPhoneInput = document.getElementById("phone");
const settingsAvatar = document.getElementById("profileAvatar");

/* ===================== INIT MENU ===================== */

function initProfileMenu() {
  if (!profileToggle || !profileMenu) return;

  // Toggle dropdown
  profileToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("hidden");
  });

  // Close on outside click
  document.addEventListener("click", () => {
    profileMenu.classList.add("hidden");
  });

  // Prevent close when clicking inside
  profileMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // View Profile → Settings
  viewProfileBtn?.addEventListener("click", () => {
    profileMenu.classList.add("hidden");
    showView("view-settings");
  });

  // Logout
  logoutBtn?.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "/login";
  });
}

/* ===================== LOAD USER PROFILE ===================== */

async function loadUserProfile() {
  try {
    const res = await api_getUserProfile();
    const user = res?.user || res;
    if (!user) return;

    // Cache user
    sessionStorage.setItem("user", JSON.stringify(user));

    // Header name
    if (profileNameEl) profileNameEl.textContent = user.name || "";

    // Header role
    if (profileRoleEl && user.role) {
      profileRoleEl.textContent =
        user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }

    // Avatar
    if (headerAvatarImg && user.name) {
      headerAvatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=0D8ABC&color=fff`;
    }

    await applyPremiumStatus();
  } catch (err) {
    console.error("[PROFILE] Load failed:", err);
    showToast("Failed to load profile", "error");
  }
}

/* ===================== SETTINGS POPULATION ===================== */

async function populateSettings() {
  try {
    const res = await api_getUserProfile();
    const user = res?.user || res;
    if (!user) return;

    if (settingsNameInput) settingsNameInput.value = user.name || "";
    if (settingsEmailInput) settingsEmailInput.value = user.email || "";
    if (settingsPhoneInput) settingsPhoneInput.value = user.phone || "";

    if (settingsAvatar && user.name) {
      settingsAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
  } catch (err) {
    console.error("[PROFILE] Settings load failed:", err);
  }
}

/* ===================== VIEW LISTENER ===================== */

document.addEventListener("view:change", (e) => {
  if (e.detail?.viewId === "view-settings") {
    populateSettings();
  }
});

/* ===================== PREMIUM ===================== */

async function applyPremiumStatus() {
  try {
    const res = await api_checkPremiumStatus();
    const isPremium = Boolean(res?.isPremium);

    premiumBadgeEls.forEach((el) => {
      el.classList.toggle("hidden", !isPremium);
    });
  } catch {
    console.warn("[PROFILE] Premium check failed");
  }
}

/* ===================== EXPORTS ===================== */

export {
  initProfileMenu,
  loadUserProfile,
};
