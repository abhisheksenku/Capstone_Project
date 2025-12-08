const registerTransactionHandlers = (io, socket) => {
  const userId = socket.user.id;

  // If API layer emits "transaction_created"
  socket.on("transaction_created", (data) => {
    io.to(`user_${userId}`).emit("transaction_added", data);
  });
};

module.exports = registerTransactionHandlers;
