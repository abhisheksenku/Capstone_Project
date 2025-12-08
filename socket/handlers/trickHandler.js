const registerTrickHandlers =  (io, socket) => {
  // Send live ticker every 5 seconds
  const interval = setInterval(() => {
    const sample = [
      { symbol: "AAPL", price: 188 + Math.random() * 2 },
      { symbol: "TSLA", price: 257 + Math.random() * 2 },
      { symbol: "NVDA", price: 870 + Math.random() * 2 },
    ];

    io.to(`user_${socket.user.id}`).emit("ticker_update", sample);
  }, 5000);

  socket.on("disconnect", () => clearInterval(interval));
};
module.exports = registerTrickHandlers;