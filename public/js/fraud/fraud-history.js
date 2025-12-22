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
    if (e.detail?.viewId === "view-fraud") {
      // DO NOTHING here
      // overview should be default
    }
  });

  document
    .getElementById("btnViewFraudAnalysis")
    ?.addEventListener("click", () => {
      showAnalysisSection();
      loadFraudHistory();
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
    console.log("[FRAUD] loadFraudHistory() called");

    if (!fraudHistoryBody) return;

    fraudHistoryBody.innerHTML = "";

    const res = await api_getFraudHistory();
    console.log("[FRAUD] API raw response:", res);

    // ✅ Support both API shapes:
    // 1) res = { items: [...] }
    // 2) res = [...]
    const items = Array.isArray(res) ? res : (res?.items || []);

    console.log("[FRAUD] Parsed items:", items);

    if (!Array.isArray(items) || items.length === 0) {
      renderEmpty();
      return;
    }

    fraudHistoryEmpty?.classList.add("hidden");

    items.forEach((item) => {
      const scoreRaw =
        item.fraudScore ?? item.fraud_score ?? item.probability ?? 0;

      const score = Number(scoreRaw) || 0;

      // ✅ Your schema mostly stores fraudScore but not "label"
      // So derive label if missing
      const isFraud =
        item.label === "FRAUD" ||
        item.label === 1 ||
        item.label === true ||
        score >= 0.7;

      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50 cursor-pointer";

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
    console.error("Failed to load fraud history:", err);
    showToast("Failed to load fraud history", "error");
    renderEmpty();
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

export { initFraudHistory, loadFraudHistory };
