require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql"
  }
);

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully");

    await sequelize.sync({ force: true });
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
};
module.exports = sequelize;
module.exports.connectMySQL = connectMySQL;
