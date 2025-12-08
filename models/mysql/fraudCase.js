// models/mysql/fraudCase.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const FraudCase = sequelize.define(
  "FraudCase",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    case_id: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },

    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    related_transaction_id: {
      type: DataTypes.STRING(100), // FIXED
      allowNull: true,
    },

    mongo_transaction_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    fraud_score: {
      type: DataTypes.DECIMAL(5, 3), // 0.000 – 1.000
      allowNull: false,
    },

    // 0 = normal, 1 = fraudulent (used by getStats)
    label: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    // used by geo-risk map (IN, US, UK, SG, etc.)
    country: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },

    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      defaultValue: "medium",
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("pending", "in_progress", "closed"),
      defaultValue: "pending",
      allowNull: false,
    },

    assigned_to: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "fraud_cases",
    timestamps: true,
    indexes: [
      { fields: ["case_id"], unique: true },
      { fields: ["user_id"] },
      { fields: ["label"] },
      { fields: ["country"] },
      { fields: ["priority"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = FraudCase;
