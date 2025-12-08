const mongoose = require("mongoose");

const BatchJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: Number,
      required: true,
    },

    filename: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "scoring", "completed", "failed"],
      default: "pending",
    },

    totalRows: {
      type: Number,
      default: 0,
    },

    processedRows: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "batch_jobs",
    timestamps: true,
  }
);

module.exports = mongoose.model("BatchJob", BatchJobSchema);
