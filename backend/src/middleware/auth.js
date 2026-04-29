import jwt   from 'jsonwebtoken';
import { users } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * authenticate  —  verifies the Bearer token and attaches req.user.
 * Returns 401 if the token is missing, malformed, expired, or the user
 * no longer exists in the store.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = header.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expired'
      : 'Invalid token';
    return res.status(401).json({ success: false, message });
  }

  const user = users.get(payload.id);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  // Strip password before attaching to request
  const { password: _, ...safeUser } = user;
  req.user = safeUser;
  next();
}