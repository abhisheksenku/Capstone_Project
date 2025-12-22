const express = require("express");
const router = express.Router();
const userAuthenticate = require('../middleware/auth');
const fraudController = require('../controllers/fraudController');
// 1) GET Fraud Stats
router.get(
  "/stats",
  userAuthenticate.authenticate,
  fraudController.getFraudStats
);

// 2) GET ML Fraud History
router.get(
  "/history",
  userAuthenticate.authenticate,
  fraudController.getModelHistory
);

// 3) GET Geo Risk
router.get(
  "/geo-risk",
  userAuthenticate.authenticate,
  fraudController.getGeoRisk
);

// 4) GET Fraud Cases
router.get(
  "/cases",
  userAuthenticate.authenticate,
  fraudController.getFraudCases
);

// 5) POST Test Fraud Score (ML model)
router.post(
  "/score",
  userAuthenticate.authenticate,
  fraudController.testFraud
);

// 6) GET Fraud History Detail by Transaction ID
router.get(
  "/history/:txnId",
  userAuthenticate.authenticate,
  fraudController.getFraudDetail
);
router.get(
  "/score-distribution",
  userAuthenticate.authenticate,
  fraudController.getFraudScoreDistribution
);

module.exports = router;