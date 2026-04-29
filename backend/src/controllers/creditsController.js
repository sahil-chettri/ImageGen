import { users } from '../db.js';

const PLANS = {
  starter:   { credits: 100,  price: 4.99,  label: 'Starter' },
  pro:       { credits: 500,  price: 14.99, label: 'Pro' },
  unlimited: { credits: 2000, price: 39.99, label: 'Unlimited' },
};

/** GET /api/v1/credits */
export function getCredits(req, res) {
  const user = users.get(req.user.id);
  res.json({ success: true, credits: user?.credits ?? 0, plan: user?.plan ?? 'free' });
}

/** GET /api/v1/credits/plans */
export function getPlans(req, res) {
  res.json({ success: true, plans: PLANS });
}

/** POST /api/v1/credits/purchase */
export function purchaseCredits(req, res) {
  const { plan } = req.body;
  const selected = PLANS[plan];

  if (!selected) {
    return res.status(400).json({
      success: false,
      message: `Invalid plan. Choose one of: ${Object.keys(PLANS).join(', ')}`,
    });
  }

  const user = users.get(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // In production: integrate Stripe / payment gateway here before adding credits
  user.credits += selected.credits;
  user.plan     = plan;
  users.set(user.id, user);

  res.json({
    success: true,
    message: `${selected.credits} credits added successfully`,
    credits: user.credits,
    plan:    user.plan,
  });
}