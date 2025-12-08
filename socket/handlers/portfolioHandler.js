const Portfolio = require("../../models/mysql/portfolio");
const registerPortfolioHandlers = (io, socket)=> {
  const userId = socket.user.id;

  // Portfolio added event
  socket.on("portfolio_created", (data) => {
    io.to(`user_${userId}`).emit("portfolio_added", data);
  });

  // Holding added event (optional - only if using API → WS → user logic)
  socket.on("holding_added", (data) => {
    io.to(`user_${userId}`).emit("holding_addedTO_portfolio", data);
  });
};

module.exports = registerPortfolioHandlers;
