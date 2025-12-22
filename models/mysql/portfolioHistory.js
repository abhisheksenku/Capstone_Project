const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const PortfolioValueHistory = sequelize.define(
  "PortfolioValueHistory",
  {
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED, // ✅ MATCHES users.id
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: "End-of-day total portfolio market value",
    },
  },
  {
    tableName: "portfolio_value_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "date"],
      },
    ],
  }
);

module.exports = PortfolioValueHistory;
