// routes/premiumRoutes.js
const express = require("express");
const router = express.Router();
const premiumController = require("../controllers/premiumController");
const userAuthenticate = require('../middleware/auth');

// User clicks "Upgrade Now"
router.post("/create-order", userAuthenticate.authenticate, premiumController.createOrder);

// Cashfree returns the status
router.get(
  "/payment-status",
  userAuthenticate.authenticate,
  premiumController.verifyPayment
);

// Dashboard calls → check if user is premium
router.get("/status", userAuthenticate.authenticate, premiumController.getPremiumStatus);

router.get("/gold", userAuthenticate.authenticate, premiumController.getGoldSummary);
router.get("/gold/history", userAuthenticate.authenticate, premiumController.getGoldHistory);
module.exports = router;
