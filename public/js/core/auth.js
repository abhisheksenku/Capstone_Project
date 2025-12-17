/* ============================================================================
   FIN-GUARD AUTH MODULE
   Handles token validation, auth guard, and logout
============================================================================ */

/**
 * Returns auth token from sessionStorage
 */
function getToken() {
  return sessionStorage.getItem("token");
}

/**
 * Ensures user is authenticated before loading dashboard
 * Redirects to /login if token is missing
 */
function requireAuth() {
  const token = getToken();

  if (!token) {
    console.warn("Auth token missing. Redirecting to login.");
    window.location.href = "/login";
    return false;
  }

  return true;
}

/**
 * Clears session and logs user out
 */
function logoutUser() {
  try {
    sessionStorage.clear();
    window.location.href = "/login";
  } catch (err) {
    console.error("Logout failed:", err);
  }
}

/**
 * Attaches logout handler if logout button exists
 * (safe to call globally)
 */
function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    logoutUser();
  });
}

/* ============================================================================
   EXPORTS (CommonJS)
============================================================================ */
export {
  getToken,
  requireAuth,
  logoutUser,
  initLogout,
};
