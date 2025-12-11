// controllers/dashboardController.js
const Yahoo = require("yahoo-finance2").default;
const yf = new Yahoo();

const Holding = require("../models/mysql/holding");
const Portfolio = require('../models/mysql/portfolio')
/* ============================================================
   GET /api/user/dashboard/metrics
   Returns: totalInvestment, totalPL, todaysPL, riskValue
============================================================ */
const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    const holdings = await Holding.findAll({
      include: [
        {
          model: Portfolio,
          as: "portfolio",
          where: { user_id: userId },
        },
      ],
    });

    let totalInvestment = 0;
    let totalPL = 0;
    let todaysPL = 0;

    for (const h of holdings) {
      const sym = h.symbol;
      let yahooSymbol = sym.endsWith(".NS") ? sym : sym + ".NS";

      const q = await yf.quote(yahooSymbol);

      const ltp = q.regularMarketPrice || 0;
      const prevClose = q.regularMarketPreviousClose || 0;

      const invested = Number(h.quantity) * Number(h.avg_price);
      const pnl = Number(h.quantity) * (ltp - Number(h.avg_price));
      const today = Number(h.quantity) * (ltp - prevClose);

      totalInvestment += invested;
      totalPL += pnl;
      todaysPL += today;
    }

    // Dummy VaR for now — will refine later
    const riskValue = totalInvestment * -0.02;

    return res.json({
      totalInvestment,
      totalPL,
      todaysPL,
      riskValue,
    });
  } catch (err) {
    console.error("Dashboard metrics error:", err);
    return res.status(500).json({ error: "Failed to load metrics" });
  }
};

/* ============================================================
   GET /api/user/dashboard/holdings
   Returns holdings with live LTP and P/L
============================================================ */
const getDashboardHoldings = async (req, res) => {
  try {
    const userId = req.user.id;

    const holdings = await Holding.findAll({
      include: [
        {
          model: Portfolio,
          as: "portfolio",
          where: { user_id: userId },
        },
      ],
    });

    const items = [];

    for (const h of holdings) {
      let sym = h.symbol;
      let yahooSymbol = sym.endsWith(".NS") ? sym : sym + ".NS";

      const q = await yf.quote(yahooSymbol);

      const ltp = q.regularMarketPrice || 0;
      const dayChange = q.regularMarketChangePercent || 0;

      const netPL =
        Number(h.quantity) * (ltp - Number(h.avg_price));

      items.push({
        symbol: sym,
        qty: Number(h.quantity),
        avg_price: Number(h.avg_price),
        ltp,
        dayChange,
        netPL,
      });
    }

    return res.json({ items });
  } catch (err) {
    console.error("Holdings error:", err);
    return res.status(500).json({ error: "Failed to load holdings" });
  }
};

/* ============================================================
   GET /api/user/dashboard/value-history
   Returns simple portfolio value history
============================================================ */
const getValueHistory = async (req, res) => {
  try {
    const data = [];

    // For now, return placeholder history → can replace with real logic soon
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      data.push({
        date: d,
        value: 100000 + Math.random() * 5000 - 2500,
      });
    }

    return res.json(data.reverse());
  } catch (err) {
    console.error("Value history error:", err);
    return res.status(500).json({ error: "Failed to load value history" });
  }
};

/* ============================================================
   GET /api/user/dashboard/allocation
   Returns portfolio allocation by symbol
============================================================ */
const getAllocation = async (req, res) => {
  try {
    const userId = req.user.id;

    const holdings = await Holding.findAll({
      include: [
        {
          model: Portfolio,
          as: "portfolio",
          where: { user_id: userId },
        },
      ],
    });

    const map = {};

    for (const h of holdings) {
      const invested =
        Number(h.quantity) * Number(h.avg_price);

      if (!map[h.symbol]) map[h.symbol] = 0;

      map[h.symbol] += invested;
    }

    const items = Object.keys(map).map((sym) => ({
      symbol: sym,
      value: map[sym],
    }));

    return res.json({ items });
  } catch (err) {
    console.error("Allocation error:", err);
    return res.status(500).json({ error: "Failed to load allocation" });
  }
};

module.exports = {
    getDashboardMetrics,
    getDashboardHoldings,
    getValueHistory,
    getAllocation
}