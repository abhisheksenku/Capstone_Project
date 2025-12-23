/* ============================================================================
   FIN-GUARD ALERTS
   User risk alerts: load, render, mark-as-read
   - Shows ONLY unresolved alerts
   - Clears UI immediately on resolve
============================================================================ */

/* ===================== IMPORTS ===================== */

import { api_getAlerts, api_markAllAlertsRead } from "../core/api.js";
import { showToast, escapeHtml } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const alertsList = document.getElementById("alerts-list");
const alertsEmpty = document.getElementById("alerts-empty");
const resolveAllAlertsBtn = document.getElementById("resolveAllAlertsBtn");

/* ===================== INIT ===================== */

export function initAlerts() {
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-alerts") {
      loadAlerts();
    }
  });

  resolveAllAlertsBtn?.addEventListener("click", handleResolveAll);
}

/* ===================== LOAD ALERTS ===================== */

export async function loadAlerts() {
  try {
    if (!alertsList) return;

    alertsList.innerHTML = "";
    alertsEmpty?.classList.add("hidden");

    const res = await api_getAlerts();

    // ✅ Defensive: show only unresolved alerts
    const alerts = (res?.alerts || []).filter(
      (a) => !a.resolved_at
    );

    if (!alerts.length) {
      renderEmpty();
      return;
    }

    alerts.forEach((alert) => {
      const card = document.createElement("div");

      const severityClass = getSeverityClass(alert.severity);

      card.className =
        "bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3 items-start";

      card.innerHTML = `
        <div class="mt-1">
          <span class="material-icons ${severityClass}">
            warning
          </span>
        </div>

        <div class="flex-1">
          <div class="font-semibold text-slate-800">
            ${escapeHtml(alert.alert_type || "Alert")}
          </div>
          <div class="text-sm text-slate-600 mt-1">
            ${escapeHtml(alert.message || "")}
          </div>
          <div class="text-xs text-slate-400 mt-2">
            ${new Date(alert.triggered_at).toLocaleString("en-IN")}
          </div>
        </div>
      `;

      alertsList.appendChild(card);
    });
  } catch (err) {
    console.error("[ALERTS] Load failed:", err);
    showToast("Failed to load alerts", "error");
  }
}

/* ===================== MARK ALL AS READ ===================== */

async function handleResolveAll() {
  try {
    // ✅ Instant UI clear (no stale flash)
    alertsList.innerHTML = "";
    renderEmpty();

    await api_markAllAlertsRead();
    showToast("All alerts marked as read", "success");
  } catch (err) {
    console.error("[ALERTS] Resolve failed:", err);
    showToast("Failed to resolve alerts", "error");

    // Fallback: reload from API
    loadAlerts();
  }
}

/* ===================== EMPTY STATE ===================== */

function renderEmpty() {
  alertsList.innerHTML = "";
  alertsEmpty?.classList.remove("hidden");
}

/* ===================== HELPERS ===================== */

function getSeverityClass(severity) {
  const s = severity?.toLowerCase();
  if (s === "high") return "text-rose-600";
  if (s === "medium") return "text-amber-500";
  return "text-slate-400";
}
