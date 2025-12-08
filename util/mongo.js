const mongoose = require("mongoose");
require("dotenv").config();

const connectMongo = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}${process.env.MONGO_DBNAME}`);
    console.log("MongoDB connected successfully");
    // await mongoose.connection.dropDatabase();   // IMPORTANT LINE
    // console.log("Database dropped successfully");
    // process.exit(0);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectMongo;
