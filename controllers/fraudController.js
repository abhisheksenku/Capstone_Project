// controllers/fraud/getStats.js
const FraudCase = require("../models/mysql/fraudCase");
const FraudModelOutput = require("../models/mongodb/fraudModelOutputSchema");
const { Sequelize } = require("sequelize");
const { scoreFraud } = require("../services/mlService");
const { v4: uuidv4 } = require("uuid");
const getFraudStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const total = await FraudCase.count({ where: { user_id: userId } });
    const detected = await FraudCase.count({
      where: { user_id: userId, label: 1 },
    });

    const falsePositives = await FraudCase.count({
      where: { user_id: userId, label: 0 },
    });

    const highRisk = await FraudCase.count({
      where: { user_id: userId, priority: "high" },
    });

    res.json({
      detection_rate: total ? (detected / total) * 100 : 0,
      false_positive_rate: total ? (falsePositives / total) * 100 : 0,
      total_analyzed: total,
      high_risk_users: highRisk,
    });
  } catch (err) {
    console.error("Fraud stats error:", err);
    res.status(500).json({ error: "Failed to load fraud stats" });
  }
};
const getModelHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await FraudModelOutput.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ items });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
};
const getGeoRisk = async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await FraudCase.findAll({
      where: { user_id: userId },
      attributes: [
        "country",
        [Sequelize.fn("COUNT", Sequelize.col("country")), "count"],
      ],
      group: ["country"],
    });

    const countries = {};
    rows.forEach((r) => {
      if (r.country) countries[r.country] = Number(r.get("count"));
    });

    res.json({ countries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Geo risk fetch failed" });
  }
};
const getFraudCases = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const { rows, count } = await FraudCase.findAndCountAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      cases: rows,
      pagination: {
        page,
        totalPages: Math.ceil(count / limit),
        prev: page > 1 ? page - 1 : null,
        next: page * limit < count ? page + 1 : null,
      },
    });
  } catch (err) {
    console.error("Fraud case error:", err);
    res.status(500).json({ error: "Failed to load fraud cases" });
  }
};
const testFraud = async (req, res) => {
  try {
    const payload = req.body;
    const userId = req.user.id;

    const score = await scoreFraud(payload);

    // 1️⃣ Save ML Output to MongoDB
    await FraudModelOutput.create({
      transactionId: payload.transactionId,
      userId: userId,
      fraudScore: score.fraud_probability,
      label: score.label,
      modelVersion: score.model_version,
      modelName: score.model_name || "ml-model",
      anomalyReasons: score.reasons || [],
    });

    // 2️⃣ ALWAYS save to MySQL (so geographic map gets data)
    const caseId = "CASE-" + uuidv4();

    const savedCase = await FraudCase.create({
      case_id: caseId,
      user_id: userId,
      related_transaction_id: payload.transactionId,
      fraud_score: score.fraud_probability,
      label: score.label,
      priority: score.label === 1 ? "high" : "low",
      reason: score.reasons?.join(", ") || "None",
      country: payload.geo?.country || "IN",
    });

    res.json({
      ...score,
      saved_case: savedCase.id,
      saved_to_history: true,
    });

  } catch (err) {
    console.error("Fraud score error:", err);
    res.status(500).json({ error: "Scoring failed" });
  }
};

const getFraudDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const txnId = req.params.txnId;

    const detail = await FraudModelOutput.findOne({
      transactionId: txnId,
      userId,
    });

    if (!detail) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ detail });
  } catch (err) {
    console.error("Detail error:", err);
    res.status(500).json({ error: "Failed to load detail" });
  }
};
module.exports = {
  getFraudStats,
  getModelHistory,
  getGeoRisk,
  getFraudCases,
  testFraud,
  getFraudDetail,
};
