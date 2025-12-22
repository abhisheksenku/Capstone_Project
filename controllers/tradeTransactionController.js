const TradeTransaction = require("../models/mysql/tradeTransaction");
const Holding = require("../models/mysql/holding");
const Portfolio = require("../models/mysql/portfolio");
const FraudModelOutput = require("../models/mongodb/fraudModelOutputSchema");
const FraudCase = require("../models/mysql/fraudCase");
const { scoreFraud } = require("../services/mlService");

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

    // 1️⃣ Validate holding
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

    // 2️⃣ Create transaction
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

    // 3️⃣ Update holding
    const oldQty = Number(holding.quantity);
    const oldAvg = Number(holding.avg_price);

    let newQty = oldQty;
    let newAvg = oldAvg;

    if (txn_type === "BUY") {
      newQty = oldQty + q;
      newAvg = (oldQty * oldAvg + q * p) / newQty;
    }

    if (txn_type === "SELL") {
      if (q > oldQty) {
        return res
          .status(400)
          .json({ message: "Cannot sell more than you hold" });
      }
      newQty = oldQty - q;
    }

    await holding.update({ quantity: newQty, avg_price: newAvg });

    // 4️⃣ ML fraud scoring
    const mlFeatures = {
      amount: total,
      qty: q,
      price: p,
      txn_type,
      symbol,
      user_id: userId,
      portfolio_id: holding.portfolio_id,
      holding_id: holdingId,
      timestamp: new Date(),
    };

    const rawMl = await scoreFraud(mlFeatures);

    const mlResult = {
      fraudScore: Number(rawMl.fraud_probability ?? 0),
      modelName: "fraud-baseline",
      modelVersion: "v1.0",
      reasons: rawMl.reasons || [],
    };

    const mongoTxnId = `TXN-${txn.id}`;

    // 5️⃣ Save ML output (Fraud History)
    const fraudOutput = await FraudModelOutput.create({
      transactionId: mongoTxnId,
      userId,
      mysql_txn_id: txn.id,
      modelName: mlResult.modelName,
      modelVersion: mlResult.modelVersion,
      fraudScore: mlResult.fraudScore,
      anomalyReasons: mlResult.reasons,
      features: mlFeatures,
    });

    // 6️⃣ Risk Alert (fraudScore > 0.1)
    const RISK_THRESHOLD = 0.1;
    const FRAUD_THRESHOLD = 0.7;

    if (mlResult.fraudScore > RISK_THRESHOLD) {
      await RiskAlert.create({
        user_id: userId,
        portfolio_id: holding.portfolio_id,
        alert_type: "Fraud Risk",
        severity:
          mlResult.fraudScore >= 0.9
            ? "critical"
            : mlResult.fraudScore >= 0.7
            ? "high"
            : "medium",
        message: `Suspicious transaction detected (score: ${(
          mlResult.fraudScore * 100
        ).toFixed(2)}%)`,
        metadata: {
          transactionId: mongoTxnId,
          reasons: mlResult.reasons,
        },
        triggered_at: new Date(),
      });
    }

    // 7️⃣ Fraud Case (fraudScore ≥ 0.7)
    if (mlResult.fraudScore >= FRAUD_THRESHOLD) {
      await FraudCase.create({
        case_id: `CASE-${Date.now()}`,
        user_id: userId,
        related_transaction_id: mongoTxnId,
        mongo_transaction_ref: fraudOutput._id.toString(),
        fraud_score: mlResult.fraudScore,
        label: 1,
        country: req.geo?.country || "IN",
        priority: "high",
        status: "pending",
      });
    }

    // 8️⃣ Response
    return res.status(201).json({
      message: "Transaction added",
      transaction: txn,
      updatedHolding: {
        id: holding.id,
        quantity: newQty,
        avg_price: newAvg,
      },
      fraudScore: mlResult.fraudScore,
      reasons: mlResult.reasons,
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
