import crypto from "crypto";
import pool   from "../db.js";

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const PLANS = {
  pro:   { credits: 500,  amount: 29900,  name: "Pro Plan"   }, // ₹299 in paise
  ultra: { credits: 2000, amount: 79900,  name: "Ultra Plan"  }, // ₹799 in paise
};

/* ── POST /api/v1/payment/create-order ─────────────────────────────────── */
export async function createOrder(req, res, next) {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ success: false, message: "Invalid plan." });

    const { amount, name } = PLANS[plan];

    // Dynamically import razorpay (installed at runtime)
    const Razorpay = (await import("razorpay")).default;
    const instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    const order = await instance.orders.create({
      amount,
      currency: "INR",
      receipt:  `receipt_${req.user.id}_${Date.now()}`,
      notes:    { userId: String(req.user.id), plan, name },
    });

    return res.json({
      success:  true,
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      plan,
      keyId:    RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
}

/* ── POST /api/v1/payment/verify ────────────────────────────────────────── */
export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ success: false, message: "Missing payment fields." });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan." });
    }

    // Verify signature
    const body      = razorpay_order_id + "|" + razorpay_payment_id;
    const expected  = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    // Check not already processed (idempotency)
    const { rows: existing } = await pool.query(
      `SELECT id FROM payments WHERE razorpay_payment_id = $1`,
      [razorpay_payment_id]
    );
    if (existing.length > 0) {
      return res.json({ success: true, message: "Already processed." });
    }

    const { credits } = PLANS[plan];
    const userId      = req.user.id;

    // Record payment + update credits + plan atomically
    await pool.query("BEGIN");
    try {
      await pool.query(
        `INSERT INTO payments (user_id, plan, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'captured')`,
        [userId, plan, PLANS[plan].amount / 100, razorpay_order_id, razorpay_payment_id, razorpay_signature]
      );

      await pool.query(
        `UPDATE users SET credits = credits + $1, plan = $2 WHERE id = $3`,
        [credits, plan, userId]
      );

      await pool.query("COMMIT");
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }

    // Return updated balance
    const { rows } = await pool.query(
      `SELECT credits, plan FROM users WHERE id = $1`,
      [userId]
    );

    return res.json({
      success:  true,
      message:  `Payment successful! ${credits} credits added.`,
      credits:  rows[0].credits,
      plan:     rows[0].plan,
    });
  } catch (err) {
    next(err);
  }
}

/* ── GET /api/v1/payment/history ────────────────────────────────────────── */
export async function paymentHistory(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, plan, amount, razorpay_payment_id, status, created_at
       FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    return res.json({ success: true, payments: rows });
  } catch (err) {
    next(err);
  }
}