// controllers/marketController.js
const YahooFinance = require("yahoo-finance2").default;
const yf = new YahooFinance();
/* ============================================================
   GET /api/user/market/quote/:symbol
   SAFE VERSION: auto append .NS for NSE stocks
============================================================ */
const getMarketQuote = async (req, res) => {
  try {
    let { symbol } = req.params;

    symbol = symbol.toUpperCase();

    // If symbol already has exchange suffix → keep it
    if (!symbol.includes(".")) {
      // Heuristic: Indian stocks are usually longer names
      // Frontend already sends .NS for NSE stocks
      // US stocks like AAPL, AVGO, MSFT must remain untouched
      // So DO NOTHING here
    }

    const data = await yf.quote(symbol);

    if (!data || !data.regularMarketPrice) {
      return res.status(404).json({ error: "Symbol not found" });
    }

    return res.json({
      symbol: data.symbol,
      price: data.regularMarketPrice,
      change: data.regularMarketChange,
      change_percent: data.regularMarketChangePercent,
      high: data.regularMarketDayHigh,
      low: data.regularMarketDayLow,
      open: data.regularMarketOpen,
      prevClose: data.regularMarketPreviousClose,
      currency: data.currency,
      exchange: data.fullExchangeName,
    });
  } catch (err) {
    console.error("[MARKET QUOTE ERROR]", err.message);
    return res.status(500).json({ error: "Failed to fetch quote" });
  }
};

/* ============================================================
   GET /api/user/market/history/:symbol
   Returns last 30 days OHLC history
============================================================ */
const getMarketHistory = async (req, res) => {
  try {
    const { symbol } = req.params;

    // Yahoo requires timestamps (not range)
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 1); // 1 month history

    const chart = await yf.chart(symbol, {
      period1: period1.getTime() / 1000, // convert to UNIX seconds
      interval: "1d",
    });

    if (!chart || !chart.quotes) {
      return res.json([]);
    }

    const mapped = chart.quotes.map((q) => ({
      time: q.date,
      price: q.close,
    }));

    return res.json(mapped);
  } catch (err) {
    console.error("History error:", err);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
};
/* ============================================================
   GET /api/user/market/search/:query
   SAFE VERSION: manually match NSE stocks
============================================================ */
const searchSymbols = async (req, res) => {
  try {
    const { query } = req.params;
    const q = query.toUpperCase();

    // manual symbol list (customizable)
    const stocks = [
      { symbol: "TCS.NS", name: "Tata Consultancy Services" },
      { symbol: "RELIANCE.NS", name: "Reliance Industries" },
      { symbol: "TATASTEEL.NS", name: "Tata Steel" },
      { symbol: "TATAMOTORS.NS", name: "Tata Motors" },
      { symbol: "INFY.NS", name: "Infosys" },
      { symbol: "SBIN.NS", name: "State Bank of India" },
      { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
      { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
    ];

    const items = stocks.filter(
      (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
    );

    return res.json({ results: items });
  } catch (err) {
    return res.status(500).json({ error: "Failed to search symbols" });
  }
};
/* ============================================================
   GET /api/user/market/heatmap
   SAFE VERSION: Fetch quotes one-by-one (works on all versions)
============================================================ */
const getHeatmap = async (req, res) => {
  try {
    const symbols = [
      // India – NSE
      "TCS.NS",
      "RELIANCE.NS",
      "TATASTEEL.NS",
      "TATAMOTORS.NS",
      "INFY.NS",
      "SBIN.NS",
      "ICICIBANK.NS",
      "HDFCBANK.NS",
      "AXISBANK.NS",
      "KOTAKBANK.NS",
      "LT.NS",
      "BAJFINANCE.NS",
      "ASIANPAINT.NS",
      "ITC.NS",
      "NESTLEIND.NS",

      // US – NYSE/NASDAQ
      "AAPL",
      "MSFT",
      "GOOG",
      "AMZN",
      "TSLA",
      "META",
      "NVDA",
      "NFLX",
      "AVGO",
      "ORCL",
      "JPM",
      "V",
      "MA",
      "WMT",
      "DIS",
    ];

    const items = [];

    for (const sym of symbols) {
      try {
        const q = await yf.quote(sym);

        // Ensure Yahoo response is valid
        if (!q || q.regularMarketPrice == null) continue;

        items.push({
          symbol: sym, // always a string
          price: q.regularMarketPrice,
          change: q.regularMarketChangePercent ?? 0,
        });
      } catch (err) {
        // Log the failure but continue safely
        console.log("Heatmap fetch failed:", sym, err.message);
        continue;
      }
    }

    // Always return a clean, valid array
    return res.json({ items });
  } catch (err) {
    console.log("Heatmap fatal error:", err.message);
    return res.status(500).json({ error: "Failed to fetch heatmap" });
  }
};
/* ============================================================
   GET /api/user/market/trending
   SAFE VERSION: Indian + US stocks, fetched individually
============================================================ */
const getTrending = async (req, res) => {
  try {
    const symbols = [
      // India – NSE
      "TCS.NS",
      "RELIANCE.NS",
      "TATAMOTORS.NS",
      "TATASTEEL.NS",
      "INFY.NS",
      "HDFCBANK.NS",
      "ICICIBANK.NS",
      "SBIN.NS",
      "AXISBANK.NS",
      "BAJFINANCE.NS",
      "LT.NS",
      "ASIANPAINT.NS",

      // US – NYSE / NASDAQ
      "AAPL",
      "MSFT",
      "GOOG",
      "AMZN",
      "TSLA",
      "META",
      "NVDA",
      "NFLX",
      "ORCL",
      "DIS",
      "INTC",
      "AMD",
      "AVGO",
      "WMT",
      "JPM",
    ];

    const items = [];

    for (const sym of symbols) {
      try {
        const q = await yf.quote(sym);

        // Skip symbols Yahoo didn't return valid data for
        if (!q || q.regularMarketPrice == null) continue;

        items.push({
          symbol: sym, // always a clean string
          name: q.shortName || q.longName || sym,
          price: q.regularMarketPrice,
          change: q.regularMarketChangePercent ?? 0,
          currency: q.currency || "USD",
        });
      } catch (err) {
        console.log("Trending fetch failed:", sym, err.message);
        continue;
      }
    }

    return res.json({ items });
  } catch (err) {
    console.log("Trending fatal error:", err.message);
    return res.status(500).json({ error: "Failed to fetch trending" });
  }
};
/* ============================================================
   GET /api/user/market/news/:symbol
   Returns headlines for a stock
============================================================ */
const getMarketNews = async (req, res) => {
  try {
    const { symbol } = req.params;

    const summary = await yf.quoteSummary(symbol, {
      modules: ["news"]
    });

    // summary OR summary.news may be undefined
    const newsArray =
      summary?.news && Array.isArray(summary.news)
        ? summary.news
        : [];

    const headlines = newsArray.slice(0, 10).map((n) => ({
      title: n.title || "Untitled",
      url: n.link || "",
      publisher: n.publisher || "Unknown",
      publishedAt: n.providerPublishTime
        ? n.providerPublishTime * 1000
        : null,
    }));

    return res.json({ headlines });
  } catch (err) {
    console.error("News error:", err.message);
    return res.json({ headlines: [] }); // return empty instead of 500
  }
};
module.exports = {
  getMarketQuote,
  getMarketHistory,
  searchSymbols,
  getHeatmap,
  getTrending,
  getMarketNews,
};
