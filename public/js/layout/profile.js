/* ============================================================================
   FIN-GUARD PROFILE HANDLER
   Header profile dropdown + user info rendering + Settings population (API-based)
============================================================================ */

import {
  api_getUserProfile,
  api_checkPremiumStatus,
} from "../core/api.js";

import { showToast } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

// Header dropdown toggle & menu
const profileToggle = document.getElementById("profile-menu-toggle");
const profileMenu = document.getElementById("profileMenu");

// Dropdown actions
const viewProfileBtn = document.getElementById("viewProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Header user info (text)
const profileNameEl = document.querySelector(
  ".group .text-sm.font-semibold"
);
const profileRoleEl = document.querySelector(
  ".group .text-xs.text-slate-500"
);
const premiumBadgeEls = document.querySelectorAll("#premium-badge");

// Header avatar image
const headerAvatarImg = document.getElementById("headerAvatar");

// Settings page fields
const settingsNameInput = document.getElementById("name");
const settingsEmailInput = document.getElementById("email");
const settingsPhoneInput = document.getElementById("phone");
const settingsAvatar = document.getElementById("profileAvatar");

/* ===================== PROFILE MENU ===================== */

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

  // View Profile → switch to Settings view
  if (viewProfileBtn) {
    viewProfileBtn.addEventListener("click", () => {
      profileMenu.classList.add("hidden");

      document.dispatchEvent(
        new CustomEvent("view:change", {
          detail: { viewId: "view-settings" },
        })
      );
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();
      window.location.href = "/login";
    });
  }
}

/* ===================== LOAD USER PROFILE (API) ===================== */

async function loadUserProfile() {
  try {
    const res = await api_getUserProfile();
    const user = res?.user || res;
    if (!user) return;

    // Cache user for reuse
    sessionStorage.setItem("user", JSON.stringify(user));

    // Header name
    if (profileNameEl && user.name) {
      profileNameEl.textContent = user.name;
    }

    // Header role
    if (profileRoleEl && user.role) {
      profileRoleEl.textContent =
        user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }

    // Header avatar (image)
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

/* ===================== POPULATE SETTINGS (API-BASED) ===================== */

async function populateSettingsFromApi() {
  try {
    const res = await api_getUserProfile();
    const user = res?.user || res;
    if (!user) return;
    console.log("User premium status:", user.isPremium);
    if (settingsNameInput) settingsNameInput.value = user.name || "";
    if (settingsEmailInput) settingsEmailInput.value = user.email || "";
    if (settingsPhoneInput) settingsPhoneInput.value = user.phone || "";

    if (settingsAvatar && user.name) {
      settingsAvatar.textContent =
        user.name.charAt(0).toUpperCase();
    }

    if (headerAvatarImg && user.name) {
      headerAvatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=0D8ABC&color=fff`;
    }
  } catch (err) {
    console.error("[PROFILE] Settings population failed:", err);
  }
}

/* ===================== VIEW CHANGE LISTENER ===================== */

document.addEventListener("view:change", (e) => {
  if (e.detail?.viewId === "view-settings") {
    populateSettingsFromApi();
  }
});

/* ===================== PREMIUM STATUS ===================== */

async function applyPremiumStatus() {
  try {
    const res = await api_checkPremiumStatus();

    premiumBadgeEls.forEach((el) => {
      if (res?.isPremium) el.classList.remove("hidden");
      else el.classList.add("hidden");
    });
  } catch {
    console.warn("[PROFILE] Premium status check failed");
  }
}

/* ===================== EXPORTS ===================== */

export {
  initProfileMenu,
  loadUserProfile,
};
