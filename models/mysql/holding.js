const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const Holding = sequelize.define(
  "Holding",
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

    symbol: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    quantity: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },

    avg_price: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },

    currency: {
      type: DataTypes.STRING(10),
      defaultValue: "INR",
      allowNull: false,
    },

    last_price: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },

    last_price_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "holdings",
    timestamps: true,
    indexes: [{ fields: ["portfolio_id"] }, { fields: ["symbol"] }],
  }
);

module.exports = Holding;
