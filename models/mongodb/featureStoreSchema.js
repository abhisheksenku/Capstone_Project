const mongoose = require("mongoose");

const FeatureStoreSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },

    featureVector: {
      type: Object,
      required: true,
      default: {},
    },

    version: {
      type: String,
      required: true,
    },
  },
  {
    collection: "feature_store",
    timestamps: true,
  }
);

module.exports = mongoose.model("FeatureStore", FeatureStoreSchema);
