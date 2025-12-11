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

const marketController = require('../controllers/marketController');
router.get('/market/quote/:symbol',userAuthenticate.authenticate,marketController.getMarketQuote);
router.get('/market/history/:symbol',userAuthenticate.authenticate,marketController.getMarketHistory);
router.get('/market/search/:query',userAuthenticate.authenticate,marketController.searchSymbols);
router.get('/market/heatmap',userAuthenticate.authenticate,marketController.getHeatmap);
router.get('/market/trending',userAuthenticate.authenticate,marketController.getTrending);
router.get('/market/news/:symbol',userAuthenticate.authenticate,marketController.getMarketNews);

const watchlistController = require('../controllers/watchlistController');
router.post('/watchlist/add',userAuthenticate.authenticate,watchlistController.addToWatchlist);
router.get('/watchlist/list', userAuthenticate.authenticate, watchlistController.getWatchlist);
router.delete('/watchlist/remove/:symbol',userAuthenticate.authenticate,watchlistController.removeFromWatchlist);

const riskAlertController = require('../controllers/riskAlertController');
router.get('/alerts', userAuthenticate.authenticate, riskAlertController.getAlerts);
router.patch('/alerts/:id/resolve', userAuthenticate.authenticate, riskAlertController.resolveAlert);
router.patch('/alerts/resolve-all', userAuthenticate.authenticate, riskAlertController.resolveAllAlerts);

module.exports = router;