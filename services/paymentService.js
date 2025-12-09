// services/paymentService.js
const cashfree = require("./cashfreeClient");

// ============================================================
//  CREATE PREMIUM ORDER  (NO DATABASE MODIFICATION HERE)
// ============================================================
const createPremiumOrder = async (
  orderId,
  amount,
  currency = "INR",
  userId,
  phone = "9999999999"
) => {
  try {
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const request = {
      order_id: orderId,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: `U${userId}`,
        customer_phone: phone,
      },
      order_meta: {
        return_url: `${process.env.BASE_URL}/api/premium/payment-status?order_id=${orderId}`,
        payment_methods: "cc,dc,upi",
      },

      order_expiry_time: expiry,
    };

    const res = await cashfree.PGCreateOrder(request);

    return {
      order_id: orderId,
      currency,
      amount,
      payment_session_id: res.data.payment_session_id,
    };
  } catch (err) {
    console.error("createPremiumOrder Error:", err.message);
    throw err;
  }
};

// ============================================================
//  CHECK PAYMENT STATUS  (NO DATABASE MODIFICATION HERE)
// ============================================================
const checkPaymentStatus = async (orderId) => {
  try {
    const res = await cashfree.PGOrderFetchPayments(orderId);
    const txns = res.data || [];

    let status = "failed";
    let payment_id = null;
    let amount = null;
    let signature = null;
    let time = null;

    const successTxn = txns.find((t) => t.payment_status === "SUCCESS");
    const pendingTxn = txns.find((t) => t.payment_status === "PENDING");

    if (successTxn) {
      status = "success";
      payment_id = successTxn.cf_payment_id;
      amount = successTxn.payment_amount;
      signature = successTxn.signature || null;
      time = successTxn.payment_time || null;
    } else if (pendingTxn) {
      status = "pending";
    }

    return {
      order_id: orderId,
      status,
      cf_payment_id: payment_id,
      amount_paid: amount,
      signature,
      payment_time: time,
    };
  } catch (err) {
    console.error("checkPaymentStatus Error:", err.message);
    throw err;
  }
};

// ============================================================
//  EXPORT METHODS
// ============================================================
module.exports = {
  createPremiumOrder,
  checkPaymentStatus,
};
