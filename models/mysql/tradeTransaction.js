const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const TradeTransaction = sequelize.define(
  "TradeTransaction",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    portfolio_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    holding_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    txn_type: {
      type: DataTypes.ENUM("BUY", "SELL"),
      allowNull: false,
    },

    symbol: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    qty: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },

    total: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },

    external_txn_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("completed", "pending", "failed"),
      defaultValue: "completed",
      allowNull: false,
    },
  },
  {
    tableName: "trade_transactions",
    timestamps: true,
    indexes: [
      { fields: ["portfolio_id"] },
      { fields: ["holding_id"] },
      { fields: ["symbol"] },
      { fields: ["txn_type"] },
    ],
  }
);

module.exports = TradeTransaction;
