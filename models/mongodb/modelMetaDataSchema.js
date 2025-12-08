const mongoose = require("mongoose");

const ModelMetadataSchema = new mongoose.Schema(
  {
    model_name: {
      type: String,
      required: true,
    },

    version: {
      type: String,
      required: true,
      unique: true,
    },

    training_date: {
      type: Date,
      required: true,
    },

    accuracy: {
      type: Number,
      default: null,
    },

    precision: {
      type: Number,
      default: null,
    },

    recall: {
      type: Number,
      default: null,
    },

    hyperparams: {
      type: Object,
      default: {},
    },

    training_dataset_stats: {
      type: Object,
      default: {},
    },
  },
  {
    collection: "model_metadata",
    timestamps: true,
  }
);

module.exports = mongoose.model("ModelMetadata", ModelMetadataSchema);
