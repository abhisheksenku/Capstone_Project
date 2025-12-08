const mongoose = require("mongoose");

const RawTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
    },

    accountId: {
      type: String,
      required: true,
    },

    transactionId: {
      type: String,
      required: true,
      unique: true,
    },

    symbol: {
      type: String,
      default: null,
    },

    merchant: {
      type: String,
      default: null,
    },

    purpose: {
      type: String,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
    },

    timestamp: {
      type: Date,
      required: true,
    },

    deviceInfo: {
      ip: String,
      ua: String,
    },

    geo: {
      lat: Number,
      lon: Number,
      country: String,
      city: String,
    },

    features: {
      type: Object,
      default: {},
    },
  },
  {
    collection: "raw_transactions",
    timestamps: true,
  }
);

module.exports = mongoose.model("RawTransaction", RawTransactionSchema);
