const axios = require("axios");

const ML_URL = process.env.ML_URL || "http://127.0.0.1:5001/predict";

async function scoreFraud(features) {
  try {
    const res = await axios.post(ML_URL, features);
    return res.data; 
  } catch (err) {
    console.error("ML scoring error:", err.response?.data || err.message);
    return { fraud_probability: 0, label: 0 }; // fail-safe
  }
}

module.exports = { scoreFraud };
