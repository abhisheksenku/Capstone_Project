const mongoose = require("mongoose");

const DriftMonitorSchema = new mongoose.Schema(
  {
    metric: {
      type: String,
      required: true,
    },

    value: {
      type: Number,
      required: true,
    },

    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "drift_monitor",
    timestamps: true,
  }
);

module.exports = mongoose.model("DriftMonitor", DriftMonitorSchema);
