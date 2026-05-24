// src/controllers/creditsController.js
import pool from '../db.js';

const PLANS = {
  starter:   { credits: 100,  price: 4.99,  label: 'Starter'   },
  pro:       { credits: 500,  price: 14.99, label: 'Pro'        },
  unlimited: { credits: 2000, price: 39.99, label: 'Unlimited'  },
};

/** GET /api/v1/credits */
export async function getCredits(req, res) {
  try {
    const { rows } = await pool.query(
      // BUG FIX: original query selected 'plan' which didn't exist in init.sql.
      // The column is now added in the fixed init.sql / pgvector_setup.sql.
      // Using COALESCE so existing rows with NULL plan return a safe default.
      `SELECT credits, COALESCE(plan, 'free') AS plan FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, credits: rows[0].credits, plan: rows[0].plan });
  } catch (err) {
    console.error('[credits] getCredits:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/** GET /api/v1/credits/plans */
export function getPlans(_req, res) {
  res.json({ success: true, plans: PLANS });
}

/** POST /api/v1/credits/purchase */
export async function purchaseCredits(req, res) {
  try {
    const { plan } = req.body;
    const selected = PLANS[plan];

    if (!selected) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan. Choose one of: ${Object.keys(PLANS).join(', ')}`,
      });
    }

    // TODO: integrate Stripe / payment gateway here before adding credits
    const { rows } = await pool.query(
      `UPDATE users SET credits = credits + $1, plan = $2
       WHERE id = $3
       RETURNING credits, COALESCE(plan, 'free') AS plan`,
      [selected.credits, plan, req.user.id]
    );

    if (!rows.length)
      return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: `${selected.credits} credits added successfully`,
      credits: rows[0].credits,
      plan:    rows[0].plan,
    });
  } catch (err) {
    console.error('[credits] purchaseCredits:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}