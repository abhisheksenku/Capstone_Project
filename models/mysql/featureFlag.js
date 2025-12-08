const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const FeatureFlag = sequelize.define(
  "FeatureFlag",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    flag_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    scope: {
      type: DataTypes.ENUM("global", "role", "user"),
      allowNull: false,
      defaultValue: "global",
    },
  },
  {
    tableName: "feature_flags",
    timestamps: true,
    indexes: [{ fields: ["flag_key"], unique: true }],
  }
);

module.exports = FeatureFlag;
