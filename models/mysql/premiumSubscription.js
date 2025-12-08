const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const PremiumSubscription = sequelize.define(
  "PremiumSubscription",
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

    cf_order_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    cf_payment_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    cf_signature: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    currency: {
      type: DataTypes.STRING(10),
      defaultValue: "INR",
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("pending", "active", "expired", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },

    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    payment_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "premium_subscriptions",
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["cf_order_id"], unique: true },
      { fields: ["status"] },
    ],
  }
);

module.exports = PremiumSubscription;
