const { Server } = require("socket.io");
const socketAuth = require("./middleware");
const registerPortfolioHandlers = require("./handlers/portfolioHandler");
const registerTransactionHandlers = require("./handlers/transactionHandlerFile");
const registerTickerHandlers = require("./handlers/trickHandler");
const registerFraudHandlers = require("./handlers/fraudHandler");  
const { setIo } = require("./io");
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  setIo(io);
  // Attach auth middleware
  socketAuth(io);

  io.on("connection", (socket) => {
    const user = socket.user;

    // Each user gets their own private room
    socket.join(`user_${user.id}`);

    // Premium room for real-time leaderboard
    if (user.isPremium) {
      socket.join("premium_users");
    }

    // Register all handlers
    registerPortfolioHandlers(io, socket);
    registerTransactionHandlers(io,socket);
    registerTickerHandlers(io, socket);
    registerFraudHandlers(io, socket)

    // Disconnect handling
    socket.on("disconnect", () => {
      console.log(`User ${user.id} disconnected`);
    });
  });

  return io;
}

module.exports = { initializeSocket };
