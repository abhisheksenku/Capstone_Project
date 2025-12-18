/* ============================================================================
   FIN-GUARD HELPER UTILITIES
   Common reusable UI + formatting helpers
============================================================================ */

/* ===================== FORMATTERS ===================== */

/**
 * Formats number into currency (₹ by default)
 * @param {number} value
 * @param {string} currency
 */
function formatMoney(value, currency = "₹") {
  if (value === null || value === undefined || isNaN(value)) return "--";

  return (
    currency +
    Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * Formats percentage values safely
 */
function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return "--";
  return `${Number(value).toFixed(2)}%`;
}

/**
 * Formats date into readable format
 */
function formatDate(dateStr) {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ===================== DOM HELPERS ===================== */

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Shorthand query selector
 */
function qs(selector) {
  return document.querySelector(selector);
}

/**
 * Shorthand query selector all
 */
function qsa(selector) {
  return document.querySelectorAll(selector);
}

/* ===================== TOAST NOTIFICATIONS ===================== */

/**
 * Shows global notification toast
 * Uses existing #notificationToast element
 */
function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("notificationToast");
  const msg = document.getElementById("notificationMessage");

  if (!toast || !msg) return;

  msg.textContent = message;

  toast.classList.remove(
    "bg-emerald-600",
    "bg-rose-600",
    "bg-blue-600",
    "hidden"
  );

  if (type === "success") toast.classList.add("bg-emerald-600");
  else if (type === "error") toast.classList.add("bg-rose-600");
  else toast.classList.add("bg-blue-600");

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}
/* ===================== CONFIRMATION MODAL ===================== */

/**
 * Shows global confirmation modal and resolves user choice
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmationModal");
    const confirmBtn = document.getElementById("confirmBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const messageEl = document.getElementById("confirmMessage");

    if (!modal || !confirmBtn || !cancelBtn || !messageEl) {
      console.error("Confirmation modal not found");
      resolve(false);
      return;
    }

    messageEl.textContent = message;

    // Show modal (Tailwind-compatible)
    modal.classList.remove("hidden");

    const cleanup = (result) => {
      modal.classList.add("hidden");
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    };

    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });
}

/* ===================== UI HELPERS ===================== */

/**
 * Toggles visibility using Tailwind hidden class
 */
function toggleHidden(el, show = true) {
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

/**
 * Sets text content safely
 */
function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value ?? "--";
}

/**
 * Sets innerHTML safely (escaped)
 */
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = escapeHtml(html);
}

/* ===================== PAGINATION HELPERS ===================== */

/**
 * Builds pagination buttons
 */
function buildPagination(container, page, totalPages, onChange) {
  if (!container) return;

  container.innerHTML = "";

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = page <= 1;
  prev.className = "px-3 py-1 text-sm border rounded disabled:opacity-50";
  prev.onclick = () => onChange(page - 1);

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = page >= totalPages;
  next.className = "px-3 py-1 text-sm border rounded disabled:opacity-50";
  next.onclick = () => onChange(page + 1);

  container.appendChild(prev);
  container.appendChild(
    document.createTextNode(` Page ${page} of ${totalPages} `)
  );
  container.appendChild(next);
}

/* ===================== EXPORTS ===================== */
export {
  // Formatters
  formatMoney,
  formatPercent,
  formatDate,

  // DOM helpers
  escapeHtml,
  qs,
  qsa,

  // Toast
  showToast,
  showConfirm,
  // UI helpers
  toggleHidden,
  setText,
  setHTML,

  // Pagination
  buildPagination,
};
