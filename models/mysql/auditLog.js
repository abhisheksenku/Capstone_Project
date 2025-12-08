const { DataTypes } = require("sequelize");
const sequelize = require("../../util/mysql");

const AuditLog = sequelize.define(
  "AuditLog",
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

    action_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // audit events never get updated
    indexes: [
      { fields: ["user_id"] },
      { fields: ["action_type"] },
    ],
  }
);

module.exports = AuditLog;
