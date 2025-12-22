const Holding = require("../models/mysql/holding");
const Portfolio = require("../models/mysql/portfolio");
const PortfolioValueHistory = require("../models/mysql/portfolioHistory");
const Yahoo = require("yahoo-finance2").default;
const yf = new Yahoo();

async function createDailySnapshot(userId) {
  const today = new Date().toISOString().split("T")[0];

  const holdings = await Holding.findAll({
    include: [
      {
        model: Portfolio,
        as: "portfolio",
        where: { user_id: userId },
      },
    ],
  });

  let totalValue = 0;

  for (const h of holdings) {
    let ltp = Number(h.last_price) || Number(h.avg_price) || 0;

    try {
      const symbol = h.symbol.endsWith(".NS") ? h.symbol : h.symbol + ".NS";
      const quote = await yf.quote(symbol);

      if (quote?.regularMarketPrice) {
        ltp = quote.regularMarketPrice;
        await h.update({
          last_price: ltp,
          last_price_at: new Date(),
        });
      }
    } catch {
      // fallback to cached price
    }

    totalValue += Number(h.quantity) * ltp;
  }

  await PortfolioValueHistory.upsert({
    user_id: userId,
    date: today,
    total_value: totalValue,
  });
}

module.exports = { createDailySnapshot };
