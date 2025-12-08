const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const SystemConfig = sequelize.define(
  "SystemConfig",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    config_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    config_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: "system_config",
    timestamps: true,
    createdAt: false,
    updatedAt: "updated_at",
  }
);

module.exports = SystemConfig;
