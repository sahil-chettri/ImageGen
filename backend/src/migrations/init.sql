-- init.sql — run once to initialise the base schema
-- pgvector tables are in pgvector_setup.sql (run that second)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(255)  UNIQUE NOT NULL,
  password        TEXT          NOT NULL,          -- bcrypt hash
  credits         INTEGER       NOT NULL DEFAULT 10,
  -- BUG FIX: plan column was missing but creditsController reads/writes it
  plan            VARCHAR(50)   DEFAULT NULL,
  -- BUG FIX: email_verified flag needed by OTP auth flow in LoginModal
  email_verified  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);