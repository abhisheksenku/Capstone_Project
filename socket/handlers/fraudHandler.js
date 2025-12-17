/* ============================================================================
   FRAUD SOCKET HANDLER
   Handles real-time fraud alerts
============================================================================ */

const registerFraudHandlers = (io, socket) => {
  const userId = socket.user.id;

  console.log("[SOCKET][FRAUD] Handler initialized for user:", userId);

  /**
   * Triggered when ML / API layer emits fraud result
   * Expected payload:
   * {
   *   transactionId,
   *   score,
   *   label,
   *   reason,
   *   userId
   * }
   */
  socket.on("fraud_check_result", (result) => {
    if (!result) return;

    console.log("[SOCKET][FRAUD] Fraud result received:", result);

    /* --------------------------------------------------
       Emit alert to the affected user only
    -------------------------------------------------- */
    io.to(`user_${userId}`).emit("fraud_alert", result);

    /* --------------------------------------------------
       Optional: emit to admins (dashboard / monitoring)
    -------------------------------------------------- */
    io.to("admin_room").emit("fraud_alert", {
      ...result,
      userId,
    });
  });

  /* --------------------------------------------------
     Cleanup
  -------------------------------------------------- */
  socket.on("disconnect", () => {
    console.log("[SOCKET][FRAUD] User disconnected:", userId);
  });
};

module.exports = registerFraudHandlers;
