/* ============================================================================
   FIN-GUARD ALERTS
   User risk alerts: load, render, mark-as-read
============================================================================ */

/* ===================== IMPORTS ===================== */

import { api_getAlerts, api_markAllAlertsRead } from "../core/api.js";
import { showToast, escapeHtml } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const alertsList = document.getElementById("alerts-list");
const alertsEmpty = document.getElementById("alerts-empty");
const resolveAllAlertsBtn = document.getElementById("resolveAllAlertsBtn");

/* ============================================================================
   INIT
============================================================================ */

export function initAlerts() {
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-alerts") {
      loadAlerts();
    }
  });

  resolveAllAlertsBtn?.addEventListener("click", handleResolveAll);
}

/* ============================================================================
   LOAD ALERTS
============================================================================ */

export async function loadAlerts() {
  try {
    if (!alertsList) return;

    alertsList.innerHTML = "";

    const res = await api_getAlerts();
    const alerts = res?.alerts || [];

    if (!Array.isArray(alerts) || alerts.length === 0) {
      renderEmpty();
      return;
    }

    alertsEmpty?.classList.add("hidden");

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
    console.error("Failed to load alerts:", err);
    showToast("Failed to load alerts", "error");
  }
}

/* ============================================================================
   MARK ALL AS READ
============================================================================ */

async function handleResolveAll() {
  try {
    await api_markAllAlertsRead();
    showToast("All alerts marked as read", "success");
    loadAlerts();
  } catch (err) {
    console.error("Resolve alerts failed:", err);
    showToast("Failed to resolve alerts", "error");
  }
}

/* ============================================================================
   EMPTY STATE
============================================================================ */

function renderEmpty() {
  alertsList && (alertsList.innerHTML = "");
  alertsEmpty?.classList.remove("hidden");
}

/* ============================================================================
   HELPERS
============================================================================ */

function getSeverityClass(severity) {
  const s = severity?.toLowerCase();
  if (s === "high") return "text-rose-600";
  if (s === "medium") return "text-amber-500";
  return "text-slate-400";
}
