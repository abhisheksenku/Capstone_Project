from flask import Flask, request, jsonify
import joblib
import pandas as pd
import json
import os

# ============================================================
# CONFIG
# ============================================================
MODEL_IN = os.getenv("MODEL_IN", "rf_model.pkl")
SCALER_IN = os.getenv("SCALER_IN", "scaler.pkl")
ENC_IN = os.getenv("ENC_IN", "encoders.json")

# ============================================================
# LOAD ARTIFACTS
# ============================================================
print("Loading model / scaler / encoders...")
model = joblib.load(MODEL_IN)
scaler = joblib.load(SCALER_IN)

with open(ENC_IN, "r", encoding="utf-8") as f:
    encoders = json.load(f)

# ============================================================
# COLUMN DEFINITIONS (must match train_model.py)
# ============================================================
numeric_cols = [
    "qty", "price", "trade_amount",
    "holding_age_days", "account_age_days", "portfolio_value",
    "avg_user_trade_size", "trade_velocity_5m", "abnormal_volume_ratio",
    "ip_change_detected", "ua_change_detected",
    "geo_distance_km", "country_mismatch",
    "previous_fraud_score", "anomaly_count"
]

cat_cols = ["symbol", "alerts_last_7d", "last_alert_severity"]

feature_cols = numeric_cols + cat_cols

# ============================================================
# FLASK APP
# ============================================================
app = Flask(__name__)


@app.route("/predict", methods=["POST"])
def predict():
    payload = request.json or {}

    # Convert payload → DataFrame
    df = pd.DataFrame([payload])

    # Ensure all expected columns exist
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0  # default for missing numeric OR categorical

    # Apply encoders to categorical columns
    for c in cat_cols:
        df[c] = df[c].astype(str)

        class_list = list(encoders[c].values()) if isinstance(encoders[c], dict) else list(encoders[c])

        val = df[c].iloc[0]

        if val in class_list:
            df[c] = class_list.index(val)
        else:
            df[c] = len(class_list)  # unknown category

    # Scale numeric columns
    df[numeric_cols] = scaler.transform(df[numeric_cols])

    # Predict
    proba = model.predict_proba(df[feature_cols])[0][1]
    label = int(proba >= 0.5)

    # ========================================================
    # Enhanced Reasons
    # ========================================================
    reasons = []

    if proba > 0.8:
        reasons.append("Severe anomaly detected")
    elif proba > 0.6:
        reasons.append("High deviation from normal behavior")
    elif proba > 0.4:
        reasons.append("Moderate anomaly detected")

    return jsonify({
        "fraud_probability": float(proba),
        "label": label,
        "model_version": MODEL_IN,  # returns pkl file name
        "reasons": reasons
    })


# ============================================================
# RUN SERVER
# ============================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
