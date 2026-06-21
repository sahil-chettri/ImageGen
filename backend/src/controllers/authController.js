// backend/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { sendOTPEmail, sendPasswordResetEmail, otpExpiresAt } from '../services/emailService.js';

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function safeUser(row) {
  const { password, otp_code, otp_expires_at, otp_attempts, ...rest } = row;
  return rest;
}

const MAX_OTP_ATTEMPTS = 5;

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await pool.query('SELECT id, is_verified FROM users WHERE email = $1', [normalizedEmail]);

    if (existing.rows.length > 0 && existing.rows[0].is_verified)
      return res.status(409).json({ message: 'Email already in use' });

    const otp = await sendOTPEmail(normalizedEmail, name);
    const expires = otpExpiresAt();
    const hashedPassword = await bcrypt.hash(password, 12);

    if (existing.rows.length > 0 && !existing.rows[0].is_verified) {
      await pool.query(
        `UPDATE users SET name=$1, password=$2, otp_code=$3, otp_expires_at=$4, otp_attempts=0 WHERE email=$5`,
        [name, hashedPassword, otp, expires, normalizedEmail]
      );
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password, credits, is_verified, otp_code, otp_expires_at, otp_attempts)
         VALUES ($1, $2, $3, 10, FALSE, $4, $5, 0)`,
        [name, normalizedEmail, hashedPassword, otp, expires]
      );
    }

    return res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: normalizedEmail,
      requiresVerification: true,
    });
  } catch (err) { next(err); }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export async function verifyOTP(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'email and otp are required' });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'No account found for this email' });

    const user = result.rows[0];

    if (user.is_verified && !user.otp_code)
      return res.status(400).json({ message: 'Account already verified. Please log in.' });

    if (user.otp_attempts >= MAX_OTP_ATTEMPTS)
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });

    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at))
      return res.status(410).json({ message: 'OTP has expired. Please request a new one.' });

    if (user.otp_code !== otp.trim()) {
      await pool.query('UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1', [user.id]);
      const attemptsLeft = MAX_OTP_ATTEMPTS - (user.otp_attempts + 1);
      return res.status(400).json({
        message: `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
      });
    }

    const updated = await pool.query(
      `UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0
       WHERE id = $1 RETURNING *`,
      [user.id]
    );

    const token = signToken(updated.rows[0].id);
    return res.status(200).json({ message: 'Email verified successfully!', token, user: safeUser(updated.rows[0]) });
  } catch (err) { next(err); }
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export async function resendOTP(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

    if (result.rows.length === 0)
      return res.status(200).json({ message: 'If that email exists, a new OTP has been sent.' });

    const user = result.rows[0];
    if (user.is_verified)
      return res.status(400).json({ message: 'Account already verified. Please log in.' });

    const otp = await sendOTPEmail(normalizedEmail, user.name);
    const expires = otpExpiresAt();
    await pool.query('UPDATE users SET otp_code=$1, otp_expires_at=$2, otp_attempts=0 WHERE id=$3', [otp, expires, user.id]);

    return res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (err) { next(err); }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required' });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

    if (result.rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.is_verified) {
      const otp = await sendOTPEmail(normalizedEmail, user.name);
      const expires = otpExpiresAt();
      await pool.query('UPDATE users SET otp_code=$1, otp_expires_at=$2, otp_attempts=0 WHERE id=$3', [otp, expires, user.id]);
      return res.status(403).json({
        message: 'Please verify your email before logging in. A new OTP has been sent.',
        requiresVerification: true,
        email: normalizedEmail,
      });
    }

    const token = signToken(user.id);
    return res.status(200).json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
}

// ─── Get Me ───────────────────────────────────────────────────────────────────
export async function getMe(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user: safeUser(result.rows[0]) });
  } catch (err) { next(err); }
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD)
      return res.status(401).json({ message: 'Invalid admin credentials' });

    const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({ token, admin: { email, role: 'admin' } });
  } catch (err) { next(err); }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
// POST /auth/forgot-password
// Body: { email }
// Looks up the user, generates a fresh OTP, stores it, and emails it.
// Always returns 200 to avoid leaking whether an email exists.
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query('SELECT id, name FROM users WHERE email = $1', [normalizedEmail]);

    // Security: don't reveal whether the email exists
    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'If that email is registered, a reset code has been sent.' });
    }

    const user = result.rows[0];

    // Generate OTP via emailService and store it
    const otp = await sendPasswordResetEmail(normalizedEmail, user.name);
    const expires = otpExpiresAt();

    await pool.query(
      `UPDATE users SET otp_code = $1, otp_expires_at = $2, otp_attempts = 0 WHERE id = $3`,
      [otp, expires, user.id]
    );

    return res.status(200).json({ message: 'If that email is registered, a reset code has been sent.' });
  } catch (err) { next(err); }
}

// ─── Reset Password ───────────────────────────────────────────────────────────
// POST /auth/reset-password
// Body: { email, otp, newPassword }
// Validates the OTP, then updates the user's password.
export async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'email, otp and newPassword are required' });

    if (newPassword.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query(
      'SELECT id, otp_code, otp_expires_at, otp_attempts FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'No account found for this email' });

    const user = result.rows[0];

    // Max attempts guard — prevent brute force
    if (user.otp_attempts >= MAX_OTP_ATTEMPTS)
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new reset code.' });

    // Expiry check
    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at))
      return res.status(410).json({ message: 'Reset code has expired. Please request a new one.' });

    // Increment attempts atomically BEFORE checking — prevents race condition
    await pool.query(
      'UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1',
      [user.id]
    );

    // OTP mismatch
    if (user.otp_code !== otp.trim()) {
      const attemptsLeft = MAX_OTP_ATTEMPTS - (user.otp_attempts + 1);
      return res.status(400).json({
        message: `Incorrect code. ${attemptsLeft > 0 ? `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.` : 'No attempts remaining. Please request a new code.'}`,
      });
    }

    // OTP valid — hash new password and clear OTP fields
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE users
       SET password = $1, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0
       WHERE id = $2`,
      [hashed, user.id]
    );

    return res.status(200).json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) { next(err); }
}