import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 min

/** Applied to ALL routes */
export const globalLimiter = rateLimit({
  windowMs,
  max:     parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/** Stricter limit for the /generate endpoint (expensive AI calls) */
export const generateLimiter = rateLimit({
  windowMs,
  max:     parseInt(process.env.GENERATE_RATE_LIMIT_MAX || '10'),
  message: { success: false, message: 'Generation limit reached. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
  // FIX: must use ipKeyGenerator helper for IPv6 safety
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req),
});

/** Auth endpoint limiter — prevents brute force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please wait.' },
  standardHeaders: true,
  legacyHeaders:   false,
});