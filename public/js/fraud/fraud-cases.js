/* ============================================================================
   FIN-GUARD FRAUD CASES (USER)
   Handles Fraud Case History sub-view + Test Fraud Score
   - Subview-driven
   - Refresh-safe
   - No manual DOM ownership
============================================================================ */

import {
  api_getFraudCases,
  api_testFraudScore,
} from "../core/api.js";

import {
  showToast,
  escapeHtml,
  buildPagination,
} from "../core/helpers.js";

import { showFraudSubView } from "./fraudSubView.js";

/* ===================== DOM REFERENCES ===================== */

const fraudCasesBody = document.getElementById("fraud-cases-body");
const fraudCasesEmpty = document.getElementById("fraud-cases-empty");
const fraudCasesPagination = document.getElementById("fraud-cases-pagination");

const testFraudBtn = document.getElementById("testFraudBtn");

/* ===================== INIT ===================== */

function initFraudCases() {
  // Button → Cases
  document
    .getElementById("btnViewFraudCases")
    ?.addEventListener("click", () => {
      showFraudSubView("cases");
      loadFraudCases(1);
    });

  // Restore / breadcrumb / refresh
  document.addEventListener("fraud:subview", (e) => {
    if (e.detail?.type === "cases") {
      loadFraudCases(1);
    }
  });

  // Test fraud score
  testFraudBtn?.addEventListener("click", handleTestFraud);
}

/* ===================== LOAD CASES ===================== */

async function loadFraudCases(page = 1) {
  try {
    if (!fraudCasesBody) return;

    fraudCasesBody.innerHTML = "";
    fraudCasesPagination.innerHTML = "";

    const res = await api_getFraudCases(page);

    const cases = res?.cases ?? [];
    const pagination = res?.pagination ?? {};

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
              (isHighRisk
                ? "High anomaly score detected"
                : "Transaction within normal behavior")
          )}
        </td>

        <td class="border p-2">
          ${
            c.createdAt
              ? new Date(c.createdAt).toLocaleDateString("en-IN")
              : "--"
          }
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
    console.error("[FRAUD] Failed to load cases:", err);
    showToast("Failed to load fraud cases", "error");
    renderEmpty();
  }
}

/* ===================== TEST FRAUD ===================== */

async function handleTestFraud() {
  try {
    const payload = {
      transactionId: "TXN-" + Date.now(),
      amount: 9999,
      device: "web",
      geo: { country: "IN" },
    };

    const result = await api_testFraudScore(payload);

    document.dispatchEvent(
      new CustomEvent("fraud:testResult", {
        detail: result,
      })
    );

    // Auto-refresh cases
    loadFraudCases(1);
  } catch (err) {
    console.error("[FRAUD] Test failed:", err);
    showToast("Fraud test failed", "error");
  }
}

/* ===================== EMPTY ===================== */

function renderEmpty() {
  fraudCasesBody.innerHTML = "";
  fraudCasesEmpty?.classList.remove("hidden");
  fraudCasesPagination.innerHTML = "";
}

/* ===================== EXPORTS ===================== */

export { initFraudCases, loadFraudCases };
