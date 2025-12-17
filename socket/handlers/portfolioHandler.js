/* ============================================================================
   PORTFOLIO SOCKET HANDLER (BACKEND)
   Handles real-time portfolio & holding updates for a user
   Pattern: Frontend emit → Backend relay → User room broadcast
============================================================================ */

const registerPortfolioHandlers = (io, socket) => {
  const userId = socket.user.id;

  console.log("[SOCKET][PORTFOLIO] Initialized for user:", userId);

  /* --------------------------------------------------------------------------
     PORTFOLIO CREATED
     Emitted from frontend AFTER successful REST creation
     Payload: { id, name, description, user_id, createdAt, ... }
  -------------------------------------------------------------------------- */
  socket.on("portfolio_created", (portfolio) => {
    if (!portfolio) return;

    console.log("[SOCKET][PORTFOLIO] portfolio_created:", portfolio);

    io.to(`user_${userId}`).emit("portfolio_added", portfolio);
  });

  /* --------------------------------------------------------------------------
     PORTFOLIO DELETED
     Emitted from frontend AFTER successful REST deletion
     Payload: { id }
  -------------------------------------------------------------------------- */
  socket.on("portfolio_deleted", ({ id }) => {
    if (!id) return;

    console.log("[SOCKET][PORTFOLIO] portfolio_deleted:", id);

    io.to(`user_${userId}`).emit("portfolio_deleted", { id });
  });

  /* --------------------------------------------------------------------------
     HOLDING ADDED TO PORTFOLIO
     Emitted from frontend AFTER successful REST creation
     Payload: { id, portfolio_id, symbol, quantity, avg_price, ... }
  -------------------------------------------------------------------------- */
  socket.on("holding_added", (holding) => {
    if (!holding) return;

    console.log("[SOCKET][PORTFOLIO] holding_added:", holding);

    io
      .to(`user_${userId}`)
      .emit("holding_addedTO_portfolio", holding);
  });

  /* --------------------------------------------------------------------------
     HOLDING DELETED
     Emitted from frontend AFTER successful REST deletion
     Payload: { id, portfolio_id }
  -------------------------------------------------------------------------- */
  socket.on("holding_deleted", ({ id, portfolio_id }) => {
    if (!id) return;

    console.log("[SOCKET][PORTFOLIO] holding_deleted:", id);

    io.to(`user_${userId}`).emit("holding_deleted", {
      id,
      portfolio_id,
    });
  });

  /* --------------------------------------------------------------------------
     CLEANUP
  -------------------------------------------------------------------------- */
  socket.on("disconnect", () => {
    console.log("[SOCKET][PORTFOLIO] Disconnected user:", userId);
  });
};

module.exports = registerPortfolioHandlers;
