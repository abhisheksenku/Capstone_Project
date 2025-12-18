/* ============================================================================
   FIN-GUARD FRAUD HISTORY (ML OUTPUT)
   Handles Fraud Analysis History sub-view
============================================================================ */

import { api_getFraudHistory } from "../core/api.js";
import { showToast, escapeHtml } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const sectionOverview = document.getElementById("fraud-overview-section");
const sectionAnalysis = document.getElementById("fraud-analysis-section");
const sectionCases = document.getElementById("fraud-cases-section");

const fraudHistoryBody = document.getElementById("fraud-history-body");
const fraudHistoryEmpty = document.getElementById("fraud-history-empty");

/* ============================================================================
   INIT
============================================================================ */

function initFraudHistory() {
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud-analysis") {
      showAnalysisSection();
      loadFraudHistory();
    }
  });
}

/* ============================================================================
   SECTION VISIBILITY
============================================================================ */

function showAnalysisSection() {
  sectionOverview?.classList.add("hidden");
  sectionCases?.classList.add("hidden");
  sectionAnalysis?.classList.remove("hidden");
}

/* ============================================================================
   LOAD FRAUD HISTORY
============================================================================ */

async function loadFraudHistory() {
  try {
    if (!fraudHistoryBody) return;

    fraudHistoryBody.innerHTML = "";

    const data = await api_getFraudHistory();

    if (!Array.isArray(data) || data.length === 0) {
      renderEmpty();
      return;
    }

    fraudHistoryEmpty?.classList.add("hidden");

    data.forEach((item) => {
      const probability = Number(
        item.probability ??
        item.fraudScore ??
        item.fraud_score ??
        0
      ).toFixed(4);

      const isFraud =
        item.label === "FRAUD" || item.label === 1 || item.label === true;

      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50 cursor-pointer";

      row.innerHTML = `
        <td class="border p-2">
          ${escapeHtml(item.transactionId || "--")}
        </td>
        <td class="border p-2">
          ${probability}
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
    console.error("Failed to load fraud history:", err);
    showToast("Failed to load fraud history", "error");
  }
}

/* ============================================================================
   EMPTY STATE
============================================================================ */

function renderEmpty() {
  fraudHistoryBody.innerHTML = "";
  fraudHistoryEmpty?.classList.remove("hidden");
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initFraudHistory,
  loadFraudHistory,
};
