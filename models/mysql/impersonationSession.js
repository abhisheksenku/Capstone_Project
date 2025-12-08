const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const ImpersonationSession = sequelize.define(
  "ImpersonationSession",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    admin_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    target_user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "impersonation_sessions",
    timestamps: false,
    indexes: [
      { fields: ["admin_id"] },
      { fields: ["target_user_id"] },
    ],
  }
);

module.exports = ImpersonationSession;
