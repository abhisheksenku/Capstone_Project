/* ============================================================================
   FIN-GUARD FRAUD MODALS
   Handles fraud detail modal + fraud test result modal
============================================================================ */

import { escapeHtml }  from "../core/helpers.js";

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
const fraudTestModalContent = document.getElementById(
  "fraudModalContent"
);
const fraudTestModalClose = document.getElementById(
  "fraudModalClose"
);

/* ============================================================================
   INIT
============================================================================ */

function initFraudModals() {
  // Close buttons
  if (closeFraudDetailBtn) {
    closeFraudDetailBtn.addEventListener("click", closeFraudDetail);
  }

  if (fraudTestModalClose) {
    fraudTestModalClose.addEventListener("click", closeFraudTestModal);
  }

  // Close on outside click (overlay)
  if (fraudDetailModal) {
    fraudDetailModal.addEventListener("click", (e) => {
      if (e.target === fraudDetailModal) {
        closeFraudDetail();
      }
    });
  }

  if (fraudTestModal) {
    fraudTestModal.addEventListener("click", (e) => {
      if (e.target === fraudTestModal) {
        closeFraudTestModal();
      }
    });
  }

  // Listen for custom events from other modules
  document.addEventListener("fraud:showDetail", (e) => {
    if (e.detail) {
      openFraudDetail(e.detail);
    }
  });

  document.addEventListener("fraud:testResult", (e) => {
    if (e.detail) {
      openFraudTestModal(e.detail);
    }
  });
}

/* ============================================================================
   FRAUD DETAIL MODAL
============================================================================ */

function openFraudDetail(data) {
  if (!fraudDetailModal) return;

  if (detailTxn) {
    detailTxn.textContent = escapeHtml(data.transactionId || "--");
  }

  if (detailScore) {
    detailScore.textContent = data.score ?? "--";
  }

  if (detailLabel) {
    detailLabel.textContent = escapeHtml(data.label || "--");
    detailLabel.className =
      data.label === "FRAUD"
        ? "text-rose-600 font-semibold"
        : "text-emerald-600 font-semibold";
  }

  if (detailModel) {
    detailModel.textContent = escapeHtml(data.model || "--");
  }

  if (detailReasons) {
    detailReasons.innerHTML = "";

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
  }

  fraudDetailModal.classList.remove("hidden");
}

function closeFraudDetail() {
  if (!fraudDetailModal) return;
  fraudDetailModal.classList.add("hidden");
}

/* ============================================================================
   FRAUD TEST RESULT MODAL
============================================================================ */

function openFraudTestModal(data) {
  if (!fraudTestModal || !fraudTestModalContent) return;

  fraudTestModalContent.innerHTML = `
    <div>
      <strong>Score:</strong> ${data.score}
    </div>
    <div>
      <strong>Label:</strong>
      <span class="${
        data.label === "FRAUD"
          ? "text-rose-600 font-semibold"
          : "text-emerald-600 font-semibold"
      }">
        ${escapeHtml(data.label)}
      </span>
    </div>
    <div>
      <strong>Model:</strong> ${escapeHtml(data.model || "--")}
    </div>
  `;

  fraudTestModal.classList.remove("hidden");
}

function closeFraudTestModal() {
  if (!fraudTestModal) return;
  fraudTestModal.classList.add("hidden");
}

/* ============================================================================
   EXPORTS
============================================================================ */

export {
  initFraudModals,
  openFraudDetail,
  openFraudTestModal,
};
