import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length)
      return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, credits, created_at`,
      [name.trim(), email.toLowerCase().trim(), hash]
    );

    const user  = rows[0];
    const token = signToken({ id: user.id, role: 'user' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required' });

    const { rows } = await pool.query(
      'SELECT id, name, email, password, credits FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!rows.length)
      return res.status(401).json({ message: 'Invalid credentials' });

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ id: user.id, role: 'user' });
    const { password: _pw, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD)
      return res.status(401).json({ message: 'Invalid admin credentials' });

    const token = signToken({ role: 'admin' });
    res.json({ token, admin: { email, role: 'admin' } });
  } catch (err) {
    console.error('adminLogin error:', err);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, credits, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'User not found' });

    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};