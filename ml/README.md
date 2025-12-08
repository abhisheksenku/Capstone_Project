A good **README.md** for your ML module should explain **exactly**:

1. What the module does
2. Folder structure
3. How to install dependencies
4. How to train the model
5. How to run the Flask scoring API
6. How the Node.js backend calls the ML API
7. What the input/output format looks like
8. Troubleshooting

Below is a **clean, production-ready README.md** you can paste directly into your project.

---

# **README.md (ML Module — Fraud Scoring)**

## **1. Overview**

This module provides a complete Machine Learning pipeline for fraud detection. It includes:

* Data preprocessing
* Training a RandomForest classifier
* Automatic encoding of categorical features
* Feature scaling
* Saving model artifacts (model, encoders, scaler)
* A Flask-based API for real-time fraud scoring
* Example requests for Node.js integration

The ML module runs independently and is consumed by your main Node.js backend.

---

## **2. Folder Structure**

```
/ml
  ├── train_model.py        # Train model on fraud.xlsx dataset
  ├── predict.py            # Flask API — returns fraud_score + label
  ├── preprocess.py         # Optional helpers
  ├── requirements.txt      # Python dependencies
  ├── README.md             # Documentation
  ├── example_requests.md   # Curl + Node examples
  ├── fraud.xlsx            # Training dataset (you provide)
  ├── model.pkl             # Saved trained model (auto-generated)
  ├── encoders.json         # Saved categorical encodings
  └── scaler.pkl            # Numeric scaler
```

---

## **3. Requirements**

Install Python 3.8+ (recommended).

Create virtual environment:

```
python -m venv mlenv
```

Activate:

**PowerShell:**

```
.\mlenv\Scripts\activate
```

Install dependencies:

```
pip install -r requirements.txt
```

Dependencies include:

```
flask
pandas
numpy
scikit-learn
joblib
openpyxl
```

---

## **4. Dataset Requirements (fraud.xlsx)**

Your training file must contain:

* One column named **label** (0 = legitimate, 1 = fraud)
* Any number of **numeric** and **categorical** features
* Example:

| amount | symbol | txn_type | device  | distance_km | label |
| ------ | ------ | -------- | ------- | ----------- | ----- |
| 1200   | TCS    | BUY      | Mobile  | 1.2         | 0     |
| 8500   | TSLA   | SELL     | Desktop | 320         | 1     |

All categorical features are automatically label-encoded.

---

## **5. Training the Model**

Run:

```
python train_model.py
```

This will:

* Load **fraud.xlsx**
* Clean missing data
* Encode categorical columns
* Scale numeric columns
* Train RandomForest model
* Print accuracy, precision, recall
* Save:

```
model.pkl
encoders.json
scaler.pkl
```

---

## **6. Running the Fraud Scoring API**

Start the Flask server:

```
python predict.py
```

The API runs at:

```
POST http://localhost:5001/predict
```

### **Request body**

JSON object with feature names used during training:

```json
{
  "amount": 8500,
  "symbol": "TCS",
  "txn_type": "SELL",
  "device": "Mobile",
  "distance_km": 320
}
```

### **Response**

```json
{
  "fraud_score": 0.87,
  "label": 1
}
```

* **fraud_score**: probability (0–1)
* **label**: 1 = predicted fraud, 0 = normal

---

## **7. Calling ML API from Node.js**

```js
const axios = require("axios");

async function scoreTransaction(features) {
  const res = await axios.post("http://localhost:5001/predict", features);
  return res.data;  
}
```

Example usage:

```js
const result = await scoreTransaction({
  amount: 5000,
  symbol: "TCS",
  txn_type: "BUY",
  device: "Android",
  distance_km: 12
});

console.log(result);
// { fraud_score: 0.42, label: 0 }
```

---

## **8. Troubleshooting**

### **Model cannot convert string to float**

This means a categorical column was not encoded. Ensure you trained with:

```
python train_model.py
```

### **KeyError: column not found**

Your JSON input to `/predict` must contain all feature columns used during training.

### **scaler mismatch**

Delete old artifacts:

```
rm model.pkl encoders.json scaler.pkl
```

Re-run:

```
python train_model.py
```

---

## **9. Re-Training with New Data**

Replace **fraud.xlsx** with updated data.

Run:

```
python train_model.py
```

This regenerates all artifacts safely.

---

## **10. Production Notes**

* Keep `model.pkl`, `encoders.json`, and `scaler.pkl` versioned.
* Use Docker or systemd to keep `predict.py` running.
* Never expose the ML API publicly without authentication.
* Maintain consistency between training features and runtime features.

---


1. .\mlenv\Scripts\activate or .\venv\Scripts\activate after this move to cd ml folder
.\.venv\Scripts\Activate.ps1 use this if above is not working
2. python train_model.py
3. python predict.py
whenerver we run servers seperate terminals 
cd ml
python predict.py
this has to be repeated