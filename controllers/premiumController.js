// controllers/premiumController.js
const User = require("../models/mysql/user");
const PremiumSubscription = require("../models/mysql/premiumSubscription");
const {
  createPremiumOrder,
  checkPaymentStatus,
} = require("../services/paymentService");
const { v4: uuidv4 } = require("uuid");

const YahooFinance = require("yahoo-finance2").default;
const yf = new YahooFinance();


// ============================================================
// 1. CREATE ORDER (USER CLICKS UPGRADE BUTTON)
// ============================================================
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const amount = 199; // your fixed premium amount
    const currency = "INR";

    const orderId = "PRM_" + uuidv4().replace(/-/g, "").slice(0, 12);

    // Step 1: Ask Cashfree to create order (NO DB CHANGE)
    const orderInfo = await createPremiumOrder(
      orderId,
      amount,
      currency,
      userId,
      req.user.phone
    );

    // Step 2: Save order in DB with pending status
    await PremiumSubscription.create({
      user_id: userId,
      cf_order_id: orderId,
      amount_paid: amount,
      currency,
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_session_id: orderInfo.payment_session_id, // frontend uses this
      amount,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create premium order" });
  }
};

// ============================================================
// 2. PAYMENT STATUS CALLBACK (Cashfree Redirect URL)
// ============================================================
const verifyPayment = async (req, res) => {
  try {
    const orderId = req.query.order_id;
    console.log("ORDER ID RECEIVED:", orderId);

    // Query Cashfree → get latest payment state
    const statusInfo = await checkPaymentStatus(orderId);

    // DB row for this order
    const sub = await PremiumSubscription.findOne({
      where: { cf_order_id: orderId },
    });

    if (!sub) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    if (statusInfo.status === "success") {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1); // 1-month premium validity

      await sub.update({
        status: "active",
        cf_payment_id: statusInfo.cf_payment_id,
        cf_signature: statusInfo.signature,
        amount_paid: statusInfo.amount_paid,
        payment_time: statusInfo.payment_time,
        start_date: start,
        end_date: end,
      });

      // update user premium flag
      await User.update({ isPremium: true }, { where: { id: sub.user_id } });

      return res.status(200).json({
        success: true,
        message: "Payment successful. Premium activated.",
        premium_active: true,
      });
    }

    if (statusInfo.status === "pending") {
      return res.status(200).json({
        success: true,
        message: "Payment pending. Please wait.",
        premium_active: false,
      });
    }

    // FAILED
    await sub.update({ status: "cancelled" });

    return res.status(200).json({
      success: false,
      message: "Payment failed or cancelled.",
      premium_active: false,
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error checking payment status" });
  }
};

// ============================================================
// 3. GET PREMIUM STATUS (Frontend loads dashboard)
// ============================================================
const getPremiumStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ["id", "isPremium"],
    });

    return res.status(200).json({
      success: true,
      premium: user.isPremium,
    });
  } catch (err) {
    console.error("Premium Status Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch premium status" });
  }
};

/* ============================================================
   GET /api/premium/gold
   Returns today's price, yesterday's, change %, forecast
============================================================ */
const getGoldSummary = async (req, res) => {
  try {
    const symbol = "GOLD=X"; // spot gold

    const quote = await yf.quote(symbol);
    const hist = await yf.historical(symbol, { period1: "2d" });

    if (!quote || hist.length < 2)
      return res.status(500).json({ error: "Gold data unavailable" });

    const today = hist[1].close;
    const yesterday = hist[0].close;

    const change = today - yesterday;
    const percent = (change / yesterday) * 100;

    // simple forecast model: linear projection using yesterday→today slope
    const forecast = today + change * 0.5;

    return res.json({
      todayPrice: today,
      yesterdayPrice: yesterday,
      change,
      percent,
      forecastPrice: forecast,
      timestamp: new Date(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch gold data" });
  }
};
/* ============================================================
   GET /api/premium/gold/history
   Returns last 7-day gold closing prices
============================================================ */
const getGoldHistory = async (req, res) => {
  try {
    const symbol = "GOLD=X";

    const data = await yf.historical(symbol, { period1: "7d" });

    const mapped = data.map((x) => ({
      date: x.date,
      price: x.close,
    }));

    return res.json(mapped.reverse());
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch gold history" });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPremiumStatus,
  getGoldSummary,
  getGoldHistory,
};
