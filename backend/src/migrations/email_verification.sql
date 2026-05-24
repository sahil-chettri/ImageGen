-- Email Verification OTP Migration
-- Run after init.sql

-- Add email verification columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;

-- Index for fast OTP lookup
CREATE INDEX IF NOT EXISTS idx_users_email_otp ON users(email, otp_code);