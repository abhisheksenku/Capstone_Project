const Holding = require("../models/mysql/holding");
const Portfolio = require("../models/mysql/portfolio");
const TradeTransaction = require("../models/mysql/tradeTransaction");

const getHoldings = async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolioId = req.params.portfolioId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // Verify ownership
    const portfolio = await Portfolio.findOne({
      where: { id: portfolioId, user_id: userId },
    });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    const { rows, count } = await Holding.findAndCountAll({
      where: { portfolio_id: portfolioId },
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    return res.json({
      holdings: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching holdings" });
  }
};
const createHolding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { portfolio_id, symbol, quantity, avg_price } = req.body;

    if (!portfolio_id || !symbol || !quantity || !avg_price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate portfolio ownership
    const portfolio = await Portfolio.findOne({
      where: { id: portfolio_id, user_id: userId },
    });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    const holding = await Holding.create({
      portfolio_id,
      symbol,
      quantity,
      avg_price,
    });

    return res.json({ holding });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error adding holding" });
  }
};
const deleteHolding = async (req, res) => {
  try {
    const id = req.params.id;

    const count = await TradeTransaction.count({ where: { holding_id: id } });
    if (count > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete holding with transactions." });
    }

    await Holding.destroy({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  getHoldings,
  createHolding,
  deleteHolding,
};
