const TradeTransaction = require("../models/mysql/tradeTransaction");
const Holding = require("../models/mysql/holding");
const Portfolio = require("../models/mysql/portfolio");

/* ============================================================
   GET TRANSACTIONS FOR A HOLDING
   Route: GET /api/user/portfolio/holdings/:holdingId/transactions
   ============================================================ */
const getHoldingTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.holdingId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // Validate holding belongs to this user’s portfolio
    const holding = await Holding.findOne({
      where: { id: holdingId },
      include: {
        model: Portfolio,
        as: "portfolio",
        where: { user_id: userId },
      },
    });

    if (!holding) {
      return res.status(404).json({ message: "Holding not found" });
    }

    const { rows, count } = await TradeTransaction.findAndCountAll({
      where: { holding_id: holdingId },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    return res.json({
      transactions: rows,
      pagination: {
        page,
        totalPages,
        prev: page > 1 ? page - 1 : null,
        next: page < totalPages ? page + 1 : null,
      },
    });
  } catch (err) {
    console.error("Transaction fetch error:", err);
    return res.status(500).json({ message: "Error fetching transactions" });
  }
};

/* ============================================================
   CREATE A NEW TRANSACTION
   Route: POST /api/user/portfolio/transactions/add
   ============================================================ */
/* =============================================================
   UPDATE HOLDING WHEN NEW TRANSACTION IS ADDED
   ============================================================= */
/* =============================================================
   CREATE NEW TRANSACTION + UPDATE HOLDING
   Route: POST /api/user/portfolio/transactions/add
   ============================================================= */
const addTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { holdingId, symbol, qty, price, txn_type } = req.body;

    if (!holdingId || !symbol || !qty || !price || !txn_type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate holding belongs to the logged-in user's portfolio
    const holding = await Holding.findOne({
      where: { id: holdingId },
      include: {
        model: Portfolio,
        as: "portfolio",
        where: { user_id: userId },
      },
    });

    if (!holding) {
      return res.status(404).json({ message: "Holding not found" });
    }

    /* -----------------------------------------
       STEP 1: Create Transaction
       ----------------------------------------- */

    const q = Number(qty);
    const p = Number(price);
    const total = q * p;

    const txn = await TradeTransaction.create({
      portfolio_id: holding.portfolio_id,
      holding_id: holdingId,
      symbol,
      qty: q,
      price: p,
      total,
      txn_type,
      status: "completed",
    });

    /* -----------------------------------------
       STEP 2: Update Holding (Quantity + Avg Price)
       ----------------------------------------- */

    const oldQty = Number(holding.quantity);
    const oldAvg = Number(holding.avg_price);

    let newQty = oldQty;
    let newAvg = oldAvg;

    if (txn_type === "BUY") {
      newQty = oldQty + q;
      newAvg = (oldQty * oldAvg + q * p) / newQty;
    }

    if (txn_type === "SELL") {
      // Prevent negative quantity
      if (q > oldQty) {
        return res
          .status(400)
          .json({ message: "Cannot sell more than you hold" });
      }

      newQty = oldQty - q;
      newAvg = oldAvg; // avg does not change for sells
    }

    await holding.update({
      quantity: newQty,
      avg_price: newAvg,
    });
    
    return res.status(201).json({
      message: "Transaction added",
      transaction: txn,
      updatedHolding: {
        id: holding.id,
        quantity: newQty,
        avg_price: newAvg,
      },
    });
  } catch (err) {
    console.error("Transaction add error:", err);
    return res.status(500).json({ message: "Error adding transaction" });
  }
};
const deleteTransaction = async (req, res) => {
  try {
    const id = req.params.id;

    // Fetch the transaction first (to get holding_id)
    const txn = await TradeTransaction.findOne({ where: { id } });

    if (!txn) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const holdingId = txn.holding_id;

    // Delete the transaction
    await TradeTransaction.destroy({ where: { id } });

    // Recalculate holding values
    await recalcHolding(holdingId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function recalcHolding(holdingId) {
  // Get all remaining transactions for this holding
  const txns = await TradeTransaction.findAll({
    where: { holding_id: holdingId },
    order: [["createdAt", "ASC"]],
  });

  // If no transactions left → reset holding to zero
  if (txns.length === 0) {
    await Holding.update(
      { quantity: 0, avg_price: 0 },
      { where: { id: holdingId } }
    );
    return;
  }

  // Recalculate total quantity + cost based on remaining txns
  let totalQty = 0;
  let totalCost = 0;

  txns.forEach((t) => {
    const q = Number(t.qty);
    const p = Number(t.price);

    if (t.txn_type === "BUY") {
      totalQty += q;
      totalCost += q * p;
    } else if (t.txn_type === "SELL") {
      totalQty -= q; // reduce qty
      // avg remains same for sells → cost recalculated automatically
    }
  });

  const newQty = totalQty < 0 ? 0 : totalQty;
  const newAvg = newQty > 0 ? totalCost / newQty : 0;

  await Holding.update(
    { quantity: newQty, avg_price: newAvg },
    { where: { id: holdingId } }
  );
}

module.exports = {
  getHoldingTransactions,
  addTransaction,
  deleteTransaction,
};
