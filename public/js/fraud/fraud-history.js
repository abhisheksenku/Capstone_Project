/* ============================================================================
   FIN-GUARD FRAUD HISTORY (ML OUTPUT)
   Handles Fraud Analysis History sub-view
   - Refresh-safe
   - Subview-driven
   - No UI ownership conflicts
============================================================================ */

import { api_getFraudHistory } from "../core/api.js";
import { showToast, escapeHtml } from "../core/helpers.js";
import { showFraudSubView } from "./fraudSubView.js";

/* ===================== DOM REFERENCES ===================== */

const fraudHistoryBody = document.getElementById("fraud-history-body");
const fraudHistoryEmpty = document.getElementById("fraud-history-empty");

/* ===================== INIT ===================== */

function initFraudHistory() {
  // Button → Analysis History
  document
    .getElementById("btnViewFraudAnalysis")
    ?.addEventListener("click", () => {
      showFraudSubView("analysis");
      loadFraudHistory();
    });

  // Restore on refresh / navigation
  document.addEventListener("fraud:subview", (e) => {
    if (e.detail?.type === "analysis") {
      loadFraudHistory();
    }
  });
}

/* ===================== LOAD HISTORY ===================== */

async function loadFraudHistory() {
  try {
    if (!fraudHistoryBody) return;

    fraudHistoryBody.innerHTML = "";

    const res = await api_getFraudHistory();

    // Support both API shapes
    const items = Array.isArray(res) ? res : res?.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      renderEmpty();
      return;
    }

    fraudHistoryEmpty?.classList.add("hidden");

    items.forEach((item) => {
      const score = Number(
        item.fraudScore ??
          item.fraud_score ??
          item.probability ??
          0
      );

      const isFraud =
        item.label === "FRAUD" ||
        item.label === 1 ||
        item.label === true ||
        score >= 0.7;

      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50";

      row.innerHTML = `
        <td class="border p-2">
          ${escapeHtml(item.transactionId || item.transaction_id || "--")}
        </td>

        <td class="border p-2">
          ${score.toFixed(4)}
        </td>

        <td class="border p-2 ${
          isFraud
            ? "text-rose-600 font-semibold"
            : "text-emerald-600 font-semibold"
        }">
          ${isFraud ? "FRAUD" : "NORMAL"}
        </td>

        <td class="border p-2">
          ${escapeHtml(item.modelVersion || item.model_version || "--")}
        </td>

        <td class="border p-2">
          ${
            item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-IN")
              : "--"
          }
        </td>
      `;

      fraudHistoryBody.appendChild(row);
    });
  } catch (err) {
    console.error("[FRAUD] Failed to load history:", err);
    showToast("Failed to load fraud history", "error");
    renderEmpty();
  }
}

/* ===================== EMPTY STATE ===================== */

function renderEmpty() {
  fraudHistoryBody.innerHTML = "";
  fraudHistoryEmpty?.classList.remove("hidden");
}

/* ===================== EXPORTS ===================== */

export { initFraudHistory, loadFraudHistory };
