const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const WatchlistItem = sequelize.define(
  "WatchlistItem",
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

    symbol: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    tableName: "watchlist_items",
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["symbol"] },
    ],
  }
);

module.exports = WatchlistItem;
