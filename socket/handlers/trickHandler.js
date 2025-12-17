/* ============================================================================
   TICKER SOCKET HANDLER
   Sends live market ticker updates to connected users
============================================================================ */

const registerTickerHandlers = (io, socket) => {
  const userId = socket.user.id;

  console.log("[SOCKET][TICKER] Handler initialized for user:", userId);

  /**
   * Demo ticker feed
   * Replace with real market data later
   */
  const interval = setInterval(() => {
    const tickers = [
      {
        symbol: "AAPL",
        price: 188 + Math.random() * 2,
        change: Math.random() - 0.5,
      },
      {
        symbol: "TSLA",
        price: 257 + Math.random() * 2,
        change: Math.random() - 0.5,
      },
      {
        symbol: "NVDA",
        price: 870 + Math.random() * 2,
        change: Math.random() - 0.5,
      },
    ];

    io.to(`user_${userId}`).emit("market:ticker", tickers);
  }, 5000);

  /**
   * Cleanup on disconnect
   */
  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log("[SOCKET][TICKER] Stopped ticker for user:", userId);
  });
};

module.exports = registerTickerHandlers;
