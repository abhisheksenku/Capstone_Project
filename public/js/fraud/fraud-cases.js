/* ============================================================================
   FIN-GUARD FRAUD CASES (USER)
   Renders user fraud case history (MySQL-backed)
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

/* ===================== DOM REFERENCES ===================== */

const fraudCasesSection = document.getElementById(
  "fraud-cases-section"
);
const fraudCasesBody = document.getElementById(
  "fraud-cases-body"
);
const fraudCasesEmpty = document.getElementById(
  "fraud-cases-empty"
);
const fraudCasesPagination = document.getElementById(
  "fraud-cases-pagination"
);

const testFraudBtn = document.getElementById("testFraudBtn");

/* ============================================================================
   INIT
============================================================================ */

function initFraudCases() {
  // Load fraud cases when fraud view opens
  document.addEventListener("view:change", (e) => {
    if (e.detail?.viewId === "view-fraud") {
      loadFraudCases();
    }
  });

  if (testFraudBtn) {
    testFraudBtn.addEventListener("click", handleTestFraud);
  }
}

/* ============================================================================
   LOAD FRAUD CASES
============================================================================ */

async function loadFraudCases(page = 1) {
  try {
    if (!fraudCasesBody) return;

    const res = await api_getFraudCases(page);

    const cases = res?.items || res?.data || [];
    const totalPages = res?.totalPages || 1;

    fraudCasesBody.innerHTML = "";

    if (!cases.length) {
      renderEmpty();
      return;
    }

    if (fraudCasesEmpty) {
      fraudCasesEmpty.classList.add("hidden");
    }

    if (fraudCasesSection) {
      fraudCasesSection.classList.remove("hidden");
    }

    cases.forEach((c) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="border p-2">
          ${escapeHtml(c.caseId || c.id || "--")}
        </td>
        <td class="border p-2">
          ${c.score ?? "--"}
        </td>
        <td class="border p-2">
          ${escapeHtml(c.reason || "--")}
        </td>
        <td class="border p-2">
          ${new Date(c.createdAt).toLocaleDateString("en-IN")}
        </td>
      `;

      fraudCasesBody.appendChild(row);
    });

    if (fraudCasesPagination) {
      buildPagination(
        fraudCasesPagination,
        page,
        totalPages,
        loadFraudCases
      );
    }
  } catch (err) {
    console.error("Failed to load fraud cases:", err);
    showToast("Failed to load fraud cases", "error");
  }
}

/* ============================================================================
   TEST FRAUD SCORE
============================================================================ */

async function handleTestFraud() {
  try {
    const payload = {
      amount: 9999,
      location: "IN",
      device: "web",
    };

    const res = await api_testFraudScore(payload);

    showToast(
      `Fraud score: ${res.score} (${res.label})`,
      res.label === "FRAUD" ? "error" : "success"
    );
  } catch (err) {
    console.error("Fraud test failed:", err);
    showToast("Fraud test failed", "error");
  }
}

/* ============================================================================
   EMPTY STATE
============================================================================ */

function renderEmpty() {
  if (fraudCasesBody) fraudCasesBody.innerHTML = "";
  if (fraudCasesEmpty) fraudCasesEmpty.classList.remove("hidden");
  if (fraudCasesPagination)
    fraudCasesPagination.innerHTML = "";
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initFraudCases,
  loadFraudCases,
};
