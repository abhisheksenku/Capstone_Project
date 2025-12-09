const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const portfolioController = require('../controllers/portfolioController');
const holdingController = require('../controllers/holdingController');
const tradeTransactionController = require("../controllers/tradeTransactionController");
const userAuthenticate = require('../middleware/auth');
router.get('/fetch/profile',userAuthenticate.authenticate,userController.fetchProfile);
router.get('/portfolio/list', userAuthenticate.authenticate, portfolioController.getPortfolios);
router.post('/portfolio/create', userAuthenticate.authenticate, portfolioController.createPortfolio);
// GET holdings
router.get("/portfolio/holdings/:portfolioId",userAuthenticate.authenticate,holdingController.getHoldings);
// ADD holding
router.post("/portfolio/holdings/add",userAuthenticate.authenticate,holdingController.createHolding);
// GET holding → transactions
router.get(
  "/portfolio/holdings/:holdingId/transactions",userAuthenticate.authenticate,tradeTransactionController.getHoldingTransactions);
// ADD transaction
router.post("/portfolio/transactions/add",userAuthenticate.authenticate,tradeTransactionController.addTransaction);

router.delete("/delete/portfolio/:id",userAuthenticate.authenticate,portfolioController.deletePortfolio);
router.delete("/delete/holding/:id",userAuthenticate.authenticate,holdingController.deleteHolding);
router.delete("/delete/transaction/:id",userAuthenticate.authenticate,tradeTransactionController.deleteTransaction);

module.exports = router;