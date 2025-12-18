/* ============================================================================
   FIN-GUARD FRAUD MODALS
   Handles Fraud Detail Modal + Fraud Test Result Modal
   (Backend-truthful rendering only)
============================================================================ */

import { escapeHtml } from "../core/helpers.js";

/* ===================== DOM REFERENCES ===================== */

/* ---- Fraud Detail Modal ---- */
const fraudDetailModal = document.getElementById("fraud-detail-modal");
const closeFraudDetailBtn = document.getElementById("close-fraud-detail");

const detailTxn = document.getElementById("detail-txn");
const detailScore = document.getElementById("detail-score");
const detailLabel = document.getElementById("detail-label");
const detailModel = document.getElementById("detail-model");
const detailReasons = document.getElementById("detail-reasons");

/* ---- Fraud Test Result Modal ---- */
const fraudTestModal = document.getElementById("fraudModal");
const fraudTestModalContent = document.getElementById("fraudModalContent");
const fraudTestModalClose = document.getElementById("fraudModalClose");

/* ============================================================================
   INIT
============================================================================ */

function initFraudModals() {
  /* Close buttons */
  closeFraudDetailBtn?.addEventListener("click", closeFraudDetail);
  fraudTestModalClose?.addEventListener("click", closeFraudTestModal);

  /* Close on overlay click */
  fraudDetailModal?.addEventListener("click", (e) => {
    if (e.target === fraudDetailModal) closeFraudDetail();
  });

  fraudTestModal?.addEventListener("click", (e) => {
    if (e.target === fraudTestModal) closeFraudTestModal();
  });

  /* Custom events */
  document.addEventListener("fraud:showDetail", (e) => {
    if (e.detail) openFraudDetail(e.detail);
  });

  document.addEventListener("fraud:testResult", (e) => {
    if (e.detail) openFraudTestModal(e.detail);
  });
}

/* ============================================================================
   FRAUD DETAIL MODAL (History / Mongo-backed)
============================================================================ */

function openFraudDetail(data) {
  if (!fraudDetailModal || !data) return;

  const scoreRaw =
    data.fraudScore ?? data.fraud_score ?? data.score ?? 0;

  const scorePct = (Number(scoreRaw) * 100).toFixed(2) + "%";

  const isFraud =
    data.label === "FRAUD" || data.label === 1 || data.label === true;

  /* Clear previous reasons */
  detailReasons.innerHTML = "";

  /* Populate fields */
  detailTxn.textContent = escapeHtml(data.transactionId || "--");
  detailScore.textContent = scorePct;

  detailLabel.textContent = isFraud ? "FRAUD" : "NORMAL";
  detailLabel.className = isFraud
    ? "text-rose-600 font-semibold"
    : "text-emerald-600 font-semibold";

  /* Model info (only if backend provided it) */
  detailModel.textContent = escapeHtml(
    data.modelVersion || data.model || "--"
  );

  /* Reasons (only if backend provided them) */
  if (Array.isArray(data.reasons) && data.reasons.length) {
    data.reasons.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = escapeHtml(r);
      detailReasons.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "No detailed reasons available.";
    detailReasons.appendChild(li);
  }

  fraudDetailModal.classList.remove("hidden");
}

function closeFraudDetail() {
  fraudDetailModal?.classList.add("hidden");
}

/* ============================================================================
   FRAUD TEST RESULT MODAL (Live ML Test)
============================================================================ */

function openFraudTestModal(data) {
  if (!fraudTestModal || !fraudTestModalContent || !data) return;

  const scoreRaw =
    data.fraud_probability ?? data.score ?? 0;

  const scorePct = (Number(scoreRaw) * 100).toFixed(2) + "%";

  const isFraud =
    data.label === "FRAUD" || data.label === 1 || data.label === true;

  fraudTestModalContent.innerHTML = `
    <div class="mb-2">
      <strong>Fraud Probability:</strong> ${scorePct}
    </div>

    <div class="mb-2">
      <strong>Label:</strong>
      <span class="${
        isFraud
          ? "text-rose-600 font-semibold"
          : "text-emerald-600 font-semibold"
      }">
        ${isFraud ? "FRAUD" : "NORMAL"}
      </span>
    </div>

    <div class="mb-2">
      <strong>Model:</strong> —
    </div>

    <div class="text-xs text-slate-500 mt-2">
      Model metadata and explanation are not provided by the scoring service.
    </div>
  `;

  fraudTestModal.classList.remove("hidden");
}

function closeFraudTestModal() {
  fraudTestModal?.classList.add("hidden");
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initFraudModals,
  openFraudDetail,
  openFraudTestModal,
};
