/* ============================================================================
   FIN-GUARD SOCKET.IO CLIENT HANDLER
   Centralized real-time communication layer (Frontend)

   Responsibilities:
   - Establish authenticated Socket.IO connection
   - Handle reconnects and UI resync
   - Listen to server events and dispatch UI-level CustomEvents
   - Show user notifications for real-time updates

   NOTE:
   - Frontend-driven realtime model (REST → socket.emit → broadcast)
   - No business logic here
   - Clean, predictable, and isolated
============================================================================ */

/* ===================== IMPORTS ===================== */

import { getToken } from "./auth.js";
import { setSocket } from "./state.js";
import { showToast } from "./helpers.js";

/* ===================== INTERNAL HELPERS ===================== */

/**
 * Re-sync UI after initial connect or reconnect.
 * Triggers refresh events consumed by individual modules.
 */
async function resyncAfterConnect() {
  console.info("[SOCKET] Resyncing UI");

  document.dispatchEvent(new Event("dashboard:refresh"));
  document.dispatchEvent(new Event("watchlist:refresh"));
  document.dispatchEvent(new Event("market:refresh"));
  document.dispatchEvent(new Event("fraud:refresh"));
}

/* ===================== SOCKET INITIALIZER ===================== */

function initSocket() {
  /* ---- Guard: Socket.IO client ---- */
  if (!window.io) {
    console.warn("[SOCKET] Socket.IO client not loaded");
    return;
  }

  /* ---- Guard: Auth token ---- */
  const token = getToken();
  if (!token) {
    console.warn("[SOCKET] No auth token found");
    return;
  }

  /* ---- Create socket instance ---- */
  const socket = io({
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  /* ===================== CONNECTION EVENTS ===================== */

  socket.on("connect", async () => {
    console.info("[SOCKET] Connected:", socket.id);
    await resyncAfterConnect();
  });

  socket.on("disconnect", (reason) => {
    console.warn("[SOCKET] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[SOCKET] Connection error:", err.message);
  });

  /* ===================== MARKET EVENTS ===================== */
  /* Throttled ticker updates to avoid UI flooding */

  let latestTickerData = null;
  let tickerScheduled = false;

  socket.on("market:ticker", (data) => {
    latestTickerData = data;

    if (tickerScheduled) return;
    tickerScheduled = true;

    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent("market:ticker", {
          detail: latestTickerData,
        })
      );
      tickerScheduled = false;
    }, 700);
  });

  /* ===================== PORTFOLIO EVENTS ===================== */

  socket.on("portfolio_added", (data) => {
    console.log("[SOCKET][FRONTEND] portfolio_added received:", data);
    document.dispatchEvent(
      new CustomEvent("portfolio:added", { detail: data })
    );
    showToast("New portfolio added", "success");
  });

  socket.on("holding_addedTO_portfolio", (data) => {
    document.dispatchEvent(
      new CustomEvent("holding:added", { detail: data })
    );
    showToast("Holding added to portfolio", "success");
  });

  /* ===================== TRANSACTION EVENTS ===================== */

  socket.on("transaction_added", (data) => {
    document.dispatchEvent(
      new CustomEvent("transaction:added", { detail: data })
    );
    showToast("Transaction recorded", "success");
  });

  /* ===================== FRAUD EVENTS ===================== */

  socket.on("fraud_alert", (data) => {
    document.dispatchEvent(
      new CustomEvent("fraud:alert", { detail: data })
    );
    showToast("Fraud risk detected", "error");
  });

  /* ===================== STORE SOCKET INSTANCE ===================== */

  setSocket(socket);
}

/* ===================== EXPORT ===================== */

export { initSocket };
