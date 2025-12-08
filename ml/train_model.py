import pandas as pd
import joblib
import json
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score

# ============================================================
# CONFIG
# ============================================================
INPUT_FILE = "fraud.xlsx"
MODEL_OUT = "rf_model.pkl"
SCALER_OUT = "scaler.pkl"
ENC_OUT = "encoders.json"

# ============================================================
# 1. LOAD DATA
# ============================================================
df = pd.read_excel(INPUT_FILE)

# Remove rows with missing label
df = df.dropna(subset=["label"])

# ============================================================
# 2. DEFINE COLUMNS
# ============================================================

# ID columns → must be excluded from training
id_cols = ["txn_id", "user_id", "portfolio_id", "holding_id"]

# Identify categorical columns (object or string fields)
cat_cols = ["symbol", "alerts_last_7d", "last_alert_severity"]

# Numeric columns
numeric_cols = [
    "qty", "price", "trade_amount",
    "holding_age_days", "account_age_days", "portfolio_value",
    "avg_user_trade_size", "trade_velocity_5m", "abnormal_volume_ratio",
    "ip_change_detected", "ua_change_detected",
    "geo_distance_km", "country_mismatch",
    "previous_fraud_score", "anomaly_count"
]

# Target column
target_col = "label"

# ============================================================
# 3. ENCODE CATEGORICAL COLUMNS
# ============================================================
encoders = {}

for c in cat_cols:
    le = LabelEncoder()
    df[c] = df[c].astype(str)  # ensure string
    df[c] = le.fit_transform(df[c])
    
    # Save mapping
    encoders[c] = {int(k): v for k, v in enumerate(le.classes_)}

# ============================================================
# 4. COMPOSE FEATURE MATRIX
# ============================================================
feature_cols = numeric_cols + cat_cols

X = df[feature_cols].copy()
y = df[target_col].astype(int)

# ============================================================
# 5. SCALE NUMERIC COLUMNS
# ============================================================
scaler = StandardScaler()

if numeric_cols:
    X[numeric_cols] = scaler.fit_transform(X[numeric_cols])

# ============================================================
# 6. TRAIN / TEST SPLIT
# ============================================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y if y.nunique() > 1 else None
)

# ============================================================
# 7. TRAIN MODEL
# ============================================================
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    class_weight="balanced",
    random_state=42
)

print("Training model...")
model.fit(X_train, y_train)

# ============================================================
# 8. EVALUATE MODEL
# ============================================================
print("Evaluating...")
y_pred = model.predict(X_test)

try:
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
except:
    acc = accuracy_score(y_test, y_pred)
    prec = rec = 0.0

print(f"Accuracy: {acc:.4f} — Precision: {prec:.4f} — Recall: {rec:.4f}")

# ============================================================
# 9. SAVE ARTIFACTS
# ============================================================
print("Saving model ->", MODEL_OUT)
joblib.dump(model, MODEL_OUT)

print("Saving scaler ->", SCALER_OUT)
joblib.dump(scaler, SCALER_OUT)

print("Saving encoders ->", ENC_OUT)
with open(ENC_OUT, "w", encoding="utf-8") as f:
    json.dump(encoders, f, ensure_ascii=False, indent=2)

print("Done.")
