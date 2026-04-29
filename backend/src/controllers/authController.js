import bcrypt      from 'bcryptjs';
import jwt          from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { body, validationResult } from 'express-validator';
import { users }    from '../db.js';

const JWT_SECRET     = process.env.JWT_SECRET     || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function safeUser(user) {
  const { password: _, ...rest } = user;
  return rest;
}

/* ── Validators ─────────────────────────────────────────────────────────── */
export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/* ── Controllers ─────────────────────────────────────────────────────────── */
export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check duplicate email
    const existing = [...users.values()].find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id     = uuid();
    const user   = {
      id,
      name,
      email,
      password: hashed,
      credits:  20,        // free signup credits
      plan:     'free',
      createdAt: new Date().toISOString(),
    };

    users.set(id, user);

    const token = signToken(id);
    return res.status(201).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = [...users.values()].find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user.id);
    return res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

export function getMe(req, res) {
  // req.user is already attached by authenticate middleware
  res.json({ success: true, user: req.user });
}

export async function updateMe(req, res, next) {
  try {
    const { name } = req.body;
    const user = users.get(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name.trim();
    users.set(user.id, user);

    const { password: _, ...safe } = user;
    return res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
}