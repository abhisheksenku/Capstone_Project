/* ============================================================================
   TRANSACTION SOCKET HANDLER (BACKEND)
   Real-time transaction updates for a user's holdings / portfolio
   Pattern: Frontend emit → Backend relay → User room broadcast
============================================================================ */

const registerTransactionHandlers = (io, socket) => {
  const userId = socket.user.id;

  console.log("[SOCKET][TRANSACTION] Initialized for user:", userId);

  /* --------------------------------------------------------------------------
     TRANSACTION CREATED
     Emitted from frontend AFTER successful REST creation
     Payload example:
     {
       id,
       holdingId,
       symbol,
       qty,
       price,
       txn_type,
       createdAt,
       ...
     }
  -------------------------------------------------------------------------- */
  socket.on("transaction_created", (transaction) => {
    if (!transaction) return;

    console.log("[SOCKET][TRANSACTION] transaction_created:", transaction);

    io.to(`user_${userId}`).emit("transaction_added", transaction);
  });

  /* --------------------------------------------------------------------------
     TRANSACTION DELETED (FUTURE-SAFE)
     Emitted from frontend AFTER successful REST deletion
     Payload: { id, holdingId }
  -------------------------------------------------------------------------- */
  socket.on("transaction_deleted", ({ id, holdingId }) => {
    if (!id) return;

    console.log("[SOCKET][TRANSACTION] transaction_deleted:", id);

    io.to(`user_${userId}`).emit("transaction_deleted", {
      id,
      holdingId,
    });
  });

  /* --------------------------------------------------------------------------
     CLEANUP
  -------------------------------------------------------------------------- */
  socket.on("disconnect", () => {
    console.log("[SOCKET][TRANSACTION] Disconnected user:", userId);
  });
};

module.exports = registerTransactionHandlers;
