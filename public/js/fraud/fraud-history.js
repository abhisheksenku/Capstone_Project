/* ============================================================================
   FIN-GUARD FRAUD HISTORY (ML OUTPUT)
   Renders ML model fraud analysis history table
============================================================================ */

import { api_getFraudHistory } from "../core/api.js";
import { showToast, escapeHtml } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const fraudHistorySection = document.getElementById(
  "fraud-analysis-section"
);
const fraudHistoryBody = document.getElementById(
  "fraud-history-body"
);
const fraudHistoryEmpty = document.getElementById(
  "fraud-history-empty"
);

/* ============================================================================
   INIT
============================================================================ */

function initFraudHistory() {
  // Load ML fraud history when fraud view opens
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud") {
      loadFraudHistory();
    }
  });
}

/* ============================================================================
   LOAD FRAUD HISTORY
============================================================================ */

async function loadFraudHistory() {
  try {
    if (!fraudHistoryBody) return;

    const data = await api_getFraudHistory();

    fraudHistoryBody.innerHTML = "";

    if (!Array.isArray(data) || !data.length) {
      renderEmpty();
      return;
    }

    if (fraudHistoryEmpty) {
      fraudHistoryEmpty.classList.add("hidden");
    }

    if (fraudHistorySection) {
      fraudHistorySection.classList.remove("hidden");
    }

    data.forEach((item) => {
      const row = document.createElement("tr");

      const probability = Number(item.probability || 0).toFixed(4);
      const labelClass =
        item.label === "FRAUD"
          ? "text-rose-600 font-semibold"
          : "text-emerald-600 font-semibold";

      row.innerHTML = `
        <td class="border p-2">
          ${escapeHtml(item.transactionId || "--")}
        </td>
        <td class="border p-2">
          ${probability}
        </td>
        <td class="border p-2 ${labelClass}">
          ${escapeHtml(item.label || "--")}
        </td>
        <td class="border p-2">
          ${escapeHtml(item.modelVersion || "--")}
        </td>
        <td class="border p-2">
          ${new Date(item.createdAt).toLocaleDateString("en-IN")}
        </td>
      `;

      fraudHistoryBody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load fraud history:", err);
    showToast("Failed to load fraud history", "error");
  }
}

/* ============================================================================
   EMPTY STATE
============================================================================ */

function renderEmpty() {
  if (fraudHistoryEmpty) {
    fraudHistoryEmpty.classList.remove("hidden");
  }
  if (fraudHistorySection) {
    fraudHistorySection.classList.remove("hidden");
  }
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initFraudHistory,
  loadFraudHistory,
};
