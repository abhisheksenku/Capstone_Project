const  Portfolio  = require("../models/mysql/portfolio");
const Holding = require('../models/mysql/holding');
const { Op } = require("sequelize");

/* ============================================================
   GET /api/user/portfolio/list
   Returns: { portfolios: [...], pagination: {...} }
   ============================================================ */
const getPortfolios = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const { rows, count } = await Portfolio.findAndCountAll({
      where: { user_id: userId },
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    return res.json({
      portfolios: rows,
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
    console.error("Error fetching portfolios:", err);
    return res.status(500).json({ message: "Server error fetching portfolios." });
  }
};


/* ============================================================
   POST /api/user/portfolio/create
   Body: { name, description }
   Returns: created portfolio
   ============================================================ */
const createPortfolio = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Portfolio name is required." });
    }

    const portfolio = await Portfolio.create({
      user_id: userId,
      name,
      description,
    });

    return res.status(201).json(portfolio);
  } catch (err) {
    console.error("Error creating portfolio:", err);
    return res.status(500).json({ message: "Server error creating portfolio." });
  }
};
const deletePortfolio = async (req, res) => {
  try {
    const id = req.params.id;

    const count = await Holding.count({ where: { portfolio_id: id } });
    if (count > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete portfolio with holdings." });
    }

    await Portfolio.destroy({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 module.exports = {
    getPortfolios,
    createPortfolio,
    deletePortfolio
 }