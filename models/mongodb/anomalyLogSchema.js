const mongoose = require("mongoose");

const AnomalyLogSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      index: true,
    },

    reasons: {
      type: [String],
      default: [],
    },

    risk_level: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    generated_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "anomaly_logs",
    timestamps: true,
  }
);

module.exports = mongoose.model("AnomalyLog", AnomalyLogSchema);
