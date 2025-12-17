/* ============================================================================
   FIN-GUARD PREMIUM ACCESS
   FINAL STABLE VERSION – RELOAD & TAB SAFE
============================================================================ */

import {
  api_getUserProfile,
  api_createPremiumOrder,
  api_verifyPremiumPayment,
} from "../core/api.js";

import { showToast } from "../core/helpers.js";
import { loadGoldPrices } from "./gold.js";

/* ===================== DOM GETTERS ===================== */

function getPremiumDOM() {
  const dom = {
    premiumBlock: document.getElementById("premium-block"),
    goldSection: document.getElementById("gold-prices"),
    premiumBtn: document.getElementById("premium-btn"),
    headerPremiumBadge: document.getElementById("header-premium-badge"),
    featurePremiumBadge: document.getElementById("feature-premium-badge"),
    featureLink: document.getElementById("link-features"),
  };

  console.log("[PREMIUM][DOM]", {
    premiumBlock: !!dom.premiumBlock,
    goldSection: !!dom.goldSection,
    premiumBtn: !!dom.premiumBtn,
    headerPremiumBadge: !!dom.headerPremiumBadge,
    featurePremiumBadge: !!dom.featurePremiumBadge,
    featureLink: !!dom.featureLink,
  });

  return dom;
}

/* ===================== INIT ===================== */

function initPremium() {
  console.log("[PREMIUM] initPremium()");

  // ✅ RUN ON PAGE LOAD (FIX FOR RELOAD)
  checkPremiumUI("page-init");

  // ✅ RUN ON TAB SWITCH
  document.addEventListener("view:change", (e) => {
    console.log("[PREMIUM] view change →", e.detail);

    if (e.detail?.viewId === "view-features") {
      console.log("[PREMIUM] Premium tab opened");
      checkPremiumUI("tab-change");
    }
  });

  // Attach upgrade button once (DOM already loaded in module apps)
  const { premiumBtn } = getPremiumDOM();
  if (premiumBtn) {
    premiumBtn.addEventListener("click", handleUpgrade);
    console.log("[PREMIUM] Upgrade button bound");
  } else {
    console.warn("[PREMIUM] Upgrade button NOT found");
  }
}

/* ===================== UI CONTROL ===================== */

async function checkPremiumUI(source) {
  console.log(`[PREMIUM] checkPremiumUI() → ${source}`);

  try {
    const profile = await api_getUserProfile();

    console.log("[PREMIUM] Profile response:", profile);

    if (!profile || !profile.user) {
      console.error("[PREMIUM] Invalid profile payload");
      return;
    }

    const isPremium = profile.user.isPremium === true;
    console.log("[PREMIUM] isPremium =", isPremium);

    const {
      premiumBlock,
      goldSection,
      headerPremiumBadge,
      featurePremiumBadge,
      featureLink,
    } = getPremiumDOM();

    if (isPremium) {
      console.log("[PREMIUM] APPLY PREMIUM UI");

      premiumBlock?.classList.add("hidden");
      goldSection?.classList.remove("hidden");

      headerPremiumBadge?.classList.remove("hidden");
      featurePremiumBadge?.classList.remove("hidden");

      if (featureLink) {
        const label = featureLink.querySelector("span.font-medium");
        if (label) {
          label.textContent = "Premium Features (Active)";
          console.log("[PREMIUM] Sidebar label updated");
        }
      }

      loadGoldPrices();
    } else {
      console.log("[PREMIUM] APPLY NON-PREMIUM UI");

      premiumBlock?.classList.remove("hidden");
      goldSection?.classList.add("hidden");

      headerPremiumBadge?.classList.add("hidden");
      featurePremiumBadge?.classList.add("hidden");
    }
  } catch (err) {
    console.error("[PREMIUM] checkPremiumUI ERROR:", err);
  }
}

/* ===================== PAYMENT ===================== */

async function handleUpgrade() {
  console.log("[PREMIUM] Upgrade clicked");

  try {
    const res = await api_createPremiumOrder();
    console.log("[PREMIUM] Order created:", res);

    if (!res?.payment_session_id || !res?.order_id) {
      showToast("Unable to create payment order", "error");
      return;
    }

    const cashfree = new Cashfree({ mode: "sandbox" });

    const result = await cashfree.checkout({
      paymentSessionId: res.payment_session_id,
      redirectTarget: "_modal",
    });

    console.log("[PREMIUM] Cashfree result:", result);

    if (result?.error) {
      showToast("Payment cancelled", "error");
      return;
    }

    showToast("Verifying payment...");

    // ✅ THIS UPDATES DB (CRITICAL)
    await api_verifyPremiumPayment(res.order_id);

    // Re-check premium after DB update
    await checkPremiumUI("post-payment");
  } catch (err) {
    console.error("[PREMIUM] Upgrade failed:", err);
    showToast("Premium upgrade failed", "error");
  }
}

/* ===================== EXPORT ===================== */

export { initPremium };
