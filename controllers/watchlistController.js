// controllers/watchlistController.js
const WatchlistItem = require("../models/mysql/watchlist");
const { Op } = require("sequelize");

/* ============================================================
   POST /api/user/watchlist/add
   Body: { symbol }
============================================================ */
const addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol } = req.body;

    // avoid duplicates
    const exists = await WatchlistItem.findOne({
      where: { user_id: userId, symbol },
    });

    if (exists) {
      return res.json({ message: "Already in watchlist" });
    }

    const item = await WatchlistItem.create({
      user_id: userId,
      symbol,
    });

    return res.json({ message: "Added", item });
  } catch (err) {
    return res.status(500).json({ error: "Failed to add watchlist symbol" });
  }
};
/* ============================================================
   GET /api/user/watchlist/list?page=&limit=
============================================================ */
const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let offset = (page - 1) * limit;

    const { rows, count } = await WatchlistItem.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch watchlist" });
  }
};
/* ============================================================
   DELETE /api/user/watchlist/remove/:symbol
============================================================ */
const removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol } = req.params;

    const removed = await WatchlistItem.destroy({
      where: { user_id: userId, symbol },
    });

    return res.json({
      message: removed ? "Removed" : "Already removed",
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to remove symbol" });
  }
};
module.exports = {
    addToWatchlist,
    getWatchlist,
    removeFromWatchlist,
}