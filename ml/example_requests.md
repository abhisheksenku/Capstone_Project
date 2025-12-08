# Quick test (after starting Flask)


## Train
(mlenv) > python train_model.py


## Run Flask
(mlenv) > python predict.py


## cURL example
curl -X POST http://localhost:5001/predict \
-H 'Content-Type: application/json' \
-d '{"amount": 1200, "symbol": "TCS", "txn_type": "BUY", "device": "Mobile"}'


## Node.js snippet (axios)
```js
const axios = require('axios');
async function score(features){
const res = await axios.post('http://localhost:5001/predict', features);
return res.data; // { fraud_score, label }
}