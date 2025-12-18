/* ============================================================================
   FIN-GUARD FRAUD CASES (USER)
   Handles Fraud Case History sub-view + Test Fraud Score action
============================================================================ */

import { api_getFraudCases, api_testFraudScore } from "../core/api.js";

import { showToast, escapeHtml, buildPagination } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

const sectionOverview = document.getElementById("fraud-overview-section");
const sectionAnalysis = document.getElementById("fraud-analysis-section");
const sectionCases = document.getElementById("fraud-cases-section");

const fraudCasesBody = document.getElementById("fraud-cases-body");
const fraudCasesEmpty = document.getElementById("fraud-cases-empty");
const fraudCasesPagination = document.getElementById("fraud-cases-pagination");

const testFraudBtn = document.getElementById("testFraudBtn");

/* ============================================================================
   INIT
============================================================================ */

function initFraudCases() {
  // View switch
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud-cases") {
      showCasesSection();
      loadFraudCases(1);
    }
  });

  // Test fraud score button
  testFraudBtn?.addEventListener("click", handleTestFraud);
}

/* ============================================================================
   SECTION VISIBILITY
============================================================================ */

function showCasesSection() {
  sectionOverview?.classList.add("hidden");
  sectionAnalysis?.classList.add("hidden");
  sectionCases?.classList.remove("hidden");
}

/* ============================================================================
   LOAD FRAUD CASES
============================================================================ */

async function loadFraudCases(page = 1) {
  try {
    if (!fraudCasesBody) return;

    fraudCasesBody.innerHTML = "";
    fraudCasesPagination.innerHTML = "";

    const res = await api_getFraudCases(page);

    const cases = res?.cases || [];
    const pagination = res?.pagination || {};

    if (!cases.length) {
      renderEmpty();
      return;
    }

    fraudCasesEmpty?.classList.add("hidden");

    cases.forEach((c) => {
      const score = Number(c.fraud_score ?? 0);
      const isHighRisk = score >= 0.7;

      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50";

      row.innerHTML = `
        <td class="border p-2">
          ${escapeHtml(c.case_id || "--")}
        </td>
        <td class="border p-2 font-semibold ${
          isHighRisk ? "text-rose-600" : "text-amber-600"
        }">
          ${(score * 100).toFixed(2)}%
        </td>
        <td class="border p-2">
          ${escapeHtml(
            c.reason ||
              (c.fraud_score >= 0.7
                ? "High anomaly score detected"
                : "Transaction within normal behavior")
          )}

        </td>
        <td class="border p-2">
          ${new Date(c.createdAt).toLocaleDateString("en-IN")}
        </td>
      `;

      fraudCasesBody.appendChild(row);
    });

    if (pagination.totalPages > 1) {
      buildPagination(
        fraudCasesPagination,
        pagination.page || page,
        pagination.totalPages,
        loadFraudCases
      );
    }
  } catch (err) {
    console.error("Failed to load fraud cases:", err);
    showToast("Failed to load fraud cases", "error");
  }
}

/* ============================================================================
   TEST FRAUD SCORE (FIXED)
============================================================================ */

async function handleTestFraud() {
  try {
    const payload = {
      transactionId: "TXN-" + Date.now(),
      amount: 9999,
      device: "web",
      geo: { country: "IN" },
    };

    const result = await api_testFraudScore(payload);

    // 🔥 This event opens the modal
    document.dispatchEvent(
      new CustomEvent("fraud:testResult", {
        detail: result,
      })
    );

    // Optional auto-refresh
    loadFraudCases(1);
  } catch (err) {
    console.error("Fraud test failed:", err);
    showToast("Fraud test failed", "error");
  }
}

/* ============================================================================
   EMPTY STATE
============================================================================ */

function renderEmpty() {
  fraudCasesBody.innerHTML = "";
  fraudCasesEmpty?.classList.remove("hidden");
  fraudCasesPagination.innerHTML = "";
}

/* ============================================================================
   EXPORTS
============================================================================ */

export { initFraudCases, loadFraudCases };
