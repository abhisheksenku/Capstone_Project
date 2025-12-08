const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const DetectionRule = sequelize.define(
  "DetectionRule",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    conditions: {
      type: DataTypes.JSON,
      allowNull: false,
      // example: { velocity: "> 10 txn/min", amount: "> 5000", geoMismatch: true }
    },

    trigger_count_24h: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },

    precision_pct: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
    },

    status: {
      type: DataTypes.ENUM("active", "disabled"),
      defaultValue: "active",
    },
  },
  {
    tableName: "detection_rules",
    timestamps: true,
    indexes: [
      { fields: ["status"] },
      { fields: ["trigger_count_24h"] },
    ],
  }
);

module.exports = DetectionRule;
