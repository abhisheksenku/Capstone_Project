// controllers/riskAlert.controller.js
const RiskAlert = require("../models/mysql/riskAlert");
const Portfolio = require("../models/mysql/portfolio");
// ======================================================
// GET /api/alerts
// ======================================================
const getAlerts = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const alerts = await RiskAlert.findAll({
      where: { user_id: userId },
      order: [["triggered_at", "DESC"]],
    });

    return res.json({ success: true, alerts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// PATCH /api/alerts/:id/resolve
// ======================================================
const resolveAlert = async (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.id;

    const alert = await RiskAlert.findOne({
      where: { id: alertId, user_id: userId },
    });

    if (!alert)
      return res.status(404).json({ success: false, message: "Alert not found" });

    alert.resolved_at = new Date();
    await alert.save();

    return res.json({ success: true, message: "Alert resolved", alert });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// PATCH /api/alerts/resolve-all
// ======================================================
const resolveAllAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    await RiskAlert.update(
      { resolved_at: new Date() },
      { where: { user_id: userId, resolved_at: null } }
    );

    return res.json({ success: true, message: "All alerts marked as resolved" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
    getAlerts,
    resolveAlert,
    resolveAllAlerts
}