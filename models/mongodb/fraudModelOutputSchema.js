const mongoose = require("mongoose");

const FraudModelOutputSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: Number,
      required: true,   // ADD THIS
      index: true
    },

    mysql_txn_id: {
      type: Number,
      required: false,
    },

    modelName: {
      type: String,
      required: true,
    },

    modelVersion: {
      type: String,
      required: true,
    },

    fraudScore: {
      type: Number,
      required: true,
    },

    anomalyReasons: {
      type: [String],
      default: [],
    },

    features: {
      type: Object,
      default: {},
    },
  },
  {
    collection: "fraud_model_outputs",
    timestamps: true,
  }
);

module.exports = mongoose.model("FraudModelOutput", FraudModelOutputSchema);
