-- pgvector_setup.sql
-- Run AFTER init.sql
-- Requires PostgreSQL 14+ and the pgvector extension

-- ── 1. Enable the extension ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. Add missing columns to users ──────────────────────────────────────
-- plan column referenced by creditsController but missing from init.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT NULL;

-- ── 3. Generations table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generations (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             VARCHAR(50)  NOT NULL,          -- 'text-to-image' | 'image-to-image' | 'inpainting'
  prompt           TEXT         NOT NULL DEFAULT '',
  negative_prompt  TEXT                   DEFAULT '',
  ratio            VARCHAR(10)            DEFAULT '1:1',
  style            VARCHAR(50)            DEFAULT 'Photorealistic',
  image_url        TEXT,
  source_image_url TEXT,
  prompt_raw       TEXT,                           -- raw prompt before optimisation
  embedding        vector(768),                    -- nomic-embed-text produces 768-dim vectors
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_user_id  ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_embedding ON generations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── 4. Prompt history table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_history (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt      TEXT         NOT NULL,
  optimized   TEXT,
  embedding   vector(768),
  quality     FLOAT                    DEFAULT 0.5,   -- 0.0 (bad) → 1.0 (good), updated by feedback
  created_at  TIMESTAMPTZ  NOT NULL    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id  ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_embedding ON prompt_history USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── 5. Prompt templates table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_templates (
  id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category  VARCHAR(100) NOT NULL,
  template  TEXT         NOT NULL,
  embedding vector(768)
);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_embedding ON prompt_templates USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── 6. Documents table (RAG ingestion) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename    TEXT         NOT NULL,
  chunk_index INTEGER      NOT NULL DEFAULT 0,
  chunk_text  TEXT         NOT NULL,
  embedding   vector(768),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id  ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── 7. OTP / verification table (needed by auth routes) ──────────────────
-- LoginModal calls api.auth.verifyOTP and api.auth.resendOTP,
-- but init.sql has no otp_codes table.
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  code        VARCHAR(6)   NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);