const User = require("./user");
const Portfolio = require("./portfolio");
const Holding = require("./holding");
const TradeTransaction = require("./tradeTransaction");
const FraudCase = require("./fraudCase");
const RiskAlert = require("./riskAlert");
const PremiumSubscription = require("./premiumSubscription");
const FeatureFlag = require("./featureFlag");
const DetectionRule = require("./detectionRule");
const SystemConfig = require("./systemConfig");
const AuditLog = require("./auditLog");
const ImpersonationSession = require("./impersonationSession");
const WatchlistItem = require("./watchlist");
/* ============================================================
   USERS RELATIONSHIPS
   ============================================================ */

// User → Portfolios (1:M)
User.hasMany(Portfolio, {
  foreignKey: "user_id",
  as: "portfolios",
});
Portfolio.belongsTo(User, {
  foreignKey: "user_id",
  as: "owner",
});

// User → Audit Logs (1:M)
User.hasMany(AuditLog, {
  foreignKey: "user_id",
  as: "audit_logs",
});
AuditLog.belongsTo(User, {
  foreignKey: "user_id",
  as: "actor",
});

// User → Premium Subscriptions (1:M)
User.hasMany(PremiumSubscription, {
  foreignKey: "user_id",
  as: "subscriptions",
});
PremiumSubscription.belongsTo(User, {
  foreignKey: "user_id",
  as: "subscriber",
});

// User → Fraud Cases (assigned_to)
User.hasMany(FraudCase, {
  foreignKey: "assigned_to",
  as: "assigned_cases",
});
FraudCase.belongsTo(User, {
  foreignKey: "assigned_to",
  as: "assignee",
});

// User → Fraud Cases (user linked to case)
User.hasMany(FraudCase, {
  foreignKey: "user_id",
  as: "user_cases",
});
FraudCase.belongsTo(User, {
  foreignKey: "user_id",
  as: "case_user",
});

// User → Impersonation Sessions (admin)
User.hasMany(ImpersonationSession, {
  foreignKey: "admin_id",
  as: "impersonations_started",
});
ImpersonationSession.belongsTo(User, {
  foreignKey: "admin_id",
  as: "admin",
});

// User → Impersonation Sessions (target)
User.hasMany(ImpersonationSession, {
  foreignKey: "target_user_id",
  as: "impersonated_sessions",
});
ImpersonationSession.belongsTo(User, {
  foreignKey: "target_user_id",
  as: "target_user",
});

/* ============================================================
   PORTFOLIO RELATIONSHIPS
   ============================================================ */

// Portfolio → Holdings (1:M)
Portfolio.hasMany(Holding, {
  foreignKey: "portfolio_id",
  as: "holdings",
});
Holding.belongsTo(Portfolio, {
  foreignKey: "portfolio_id",
  as: "portfolio",
});

// Portfolio → Trade Transactions (1:M)
Portfolio.hasMany(TradeTransaction, {
  foreignKey: "portfolio_id",
  as: "transactions",
});
TradeTransaction.belongsTo(Portfolio, {
  foreignKey: "portfolio_id",
  as: "portfolio",
});

// Portfolio → Risk Alerts (1:M)
Portfolio.hasMany(RiskAlert, {
  foreignKey: "portfolio_id",
  as: "risk_alerts",
});
RiskAlert.belongsTo(Portfolio, {
  foreignKey: "portfolio_id",
  as: "portfolio",
});

Holding.hasMany(TradeTransaction, { foreignKey: "holding_id" });
TradeTransaction.belongsTo(Holding, { foreignKey: "holding_id" });

/* ============================================================
   FRAUD CASE RELATIONSHIPS
   ============================================================ */

// // FraudCase → TradeTransaction (Optional 1:1)
// FraudCase.belongsTo(TradeTransaction, {
//   foreignKey: "related_transaction_id",
//   as: "related_transaction",
// });
// TradeTransaction.hasOne(FraudCase, {
//   foreignKey: "related_transaction_id",
//   as: "fraud_case",
// });

/* ============================================================
   SYSTEM CONFIG RELATIONSHIPS
   ============================================================ */

// System Config updated_by → User
SystemConfig.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
User.hasMany(SystemConfig, {
  foreignKey: "updated_by",
  as: "config_updates",
});


// User → Watchlist (1:M)
User.hasMany(WatchlistItem, { foreignKey: "user_id", as: "watchlist" });
WatchlistItem.belongsTo(User, { foreignKey: "user_id", as: "user" });


/* ============================================================
   FEATURE FLAGS
   ============================================================ */

// No direct associations in the base schema
// Add if you want per-role or per-user overrides later

/* ============================================================
   DETECTION RULES
   ============================================================ */

// No direct associations — rules are standalone objects

/* ============================================================
   EXPORT ALL MODELS
   ============================================================ */

module.exports = {
  User,
  Portfolio,
  Holding,
  TradeTransaction,
  FraudCase,
  RiskAlert,
  PremiumSubscription,
  FeatureFlag,
  DetectionRule,
  SystemConfig,
  AuditLog,
  ImpersonationSession,
};
