const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const RiskAlert = sequelize.define(
  "RiskAlert",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    portfolio_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    alert_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    severity: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    triggered_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "risk_alerts",
    timestamps: false,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["portfolio_id"] },
      { fields: ["severity"] },
    ],
  }
);

module.exports = RiskAlert;
