// controllers/dashboardController.js
const Yahoo = require("yahoo-finance2").default;
const yf = new Yahoo();

const Holding = require("../models/mysql/holding");
const Portfolio = require("../models/mysql/portfolio");

/* ============================================================
   GET /api/user/dashboard/metrics
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

      // Default to DB price if Yahoo fails
      let ltp = Number(h.last_price) || Number(h.avg_price) || 0;
      let prevClose = Number(h.avg_price) || 0; // fallback

      try {
        const quote = await yf.quote(yahooSymbol);
        if (quote?.regularMarketPrice != null) {
          ltp = quote.regularMarketPrice;
          prevClose = quote.regularMarketPreviousClose || prevClose;

          // Update DB so next time we have a good fallback
          await h.update({
            last_price: ltp,
            last_price_at: new Date(),
          });
        }
      } catch (err) {
        console.warn(`Yahoo failed for ${yahooSymbol}, using cached price: ${ltp}`);
        // Continue with cached or avg_price
      }

      const invested = Number(h.quantity) * Number(h.avg_price);
      const pnl = Number(h.quantity) * (ltp - Number(h.avg_price));
      const todayChange = Number(h.quantity) * (ltp - prevClose);

      totalInvestment += invested;
      totalPL += pnl;
      todaysPL += todayChange;
    }

    const riskValue = totalInvestment * -0.02; // dummy

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
   GET /api/user/dashboard/holdings  ← THIS WAS CRASHING
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
      const sym = h.symbol;
      let yahooSymbol = sym.endsWith(".NS") ? sym : sym + ".NS";

      // Start with cached price from DB
      let ltp = Number(h.last_price) || Number(h.avg_price) || 0;
      let dayChange = 0;

      try {
        const quote = await yf.quote(yahooSymbol);
        if (quote?.regularMarketPrice != null) {
          ltp = quote.regularMarketPrice;
          dayChange = quote.regularMarketChangePercent || 0;

          // Save to DB for next time
          await h.update({
            last_price: ltp,
            last_price_at: new Date(),
          });
        } else {
          // If Yahoo returned data but no price
          dayChange = 0;
        }
      } catch (err) {
        console.warn(`Yahoo Finance failed for ${yahooSymbol}:`, err.message);
        // Use cached price → no crash!
      }

      const netPL = Number(h.quantity) * (ltp - Number(h.avg_price));

      items.push({
        symbol: sym,
        qty: Number(h.quantity),
        avg_price: Number(h.avg_price),
        ltp: Number(ltp.toFixed(2)),
        dayChange: Number(dayChange.toFixed(2)),
        netPL: Number(netPL.toFixed(2)),
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
============================================================ */
const getValueHistory = async (req, res) => {
  try {
    const data = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toISOString().split("T")[0],
        value: 100000 + Math.random() * 10000 - 5000,
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("Value history error:", err);
    return res.status(500).json({ error: "Failed to load value history" });
  }
};

/* ============================================================
   GET /api/user/dashboard/allocation
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
      let ltp = Number(h.last_price) || Number(h.avg_price) || 0;

      try {
        const quote = await yf.quote(h.symbol.endsWith(".NS") ? h.symbol : h.symbol + ".NS");
        if (quote?.regularMarketPrice) {
          ltp = quote.regularMarketPrice;
          await h.update({ last_price: ltp, last_price_at: new Date() });
        }
      } catch (err) {
        // ignore
      }

      const marketValue = Number(h.quantity) * ltp;
      map[h.symbol] = (map[h.symbol] || 0) + marketValue;
    }

    const items = Object.keys(map).map((sym) => ({
      asset: sym,
      percentage: Number(((map[sym] / Object.values(map).reduce((a, b) => a + b, 0)) * 100).toFixed(2)),
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
  getAllocation,
};