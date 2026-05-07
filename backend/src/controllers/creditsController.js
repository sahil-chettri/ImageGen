import pool from '../db.js';

const PLANS = {
  starter:   { credits: 100,  price: 4.99,  label: 'Starter' },
  pro:       { credits: 500,  price: 14.99, label: 'Pro' },
  unlimited: { credits: 2000, price: 39.99, label: 'Unlimited' },
};

/** GET /api/v1/credits */
export async function getCredits(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT credits, plan FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, credits: rows[0].credits, plan: rows[0].plan });
  } catch (err) {
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

    // In production: integrate Stripe / payment gateway here before adding credits
    const { rows } = await pool.query(
      `UPDATE users SET credits = credits + $1, plan = $2
       WHERE id = $3
       RETURNING credits, plan`,
      [selected.credits, plan, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: `${selected.credits} credits added successfully`,
      credits: rows[0].credits,
      plan:    rows[0].plan,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
