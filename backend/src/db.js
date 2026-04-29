/**
 * db.js  —  Simple in-memory store.
 * 
 * Swap this out for MongoDB / PostgreSQL by exporting the same interface
 * from a db/mongo.js or db/postgres.js file and updating the import in
 * controllers that use it.
 */

import bcrypt from 'bcryptjs';

// ── users  ──────────────────────────────────────────────────────────────────
// Map<id, User>
export const users = new Map();

// ── generations ─────────────────────────────────────────────────────────────
// Map<id, Generation>
export const generations = new Map();

// ── helper seed (demo user so the frontend works immediately) ────────────────
// FIX: original used top-level `await bcrypt.hash(...)` which causes
// "Cannot use import statement / await is only valid in async functions"
// errors in certain Node ESM contexts. hashSync is safe at module init time.
const demoHash = bcrypt.hashSync('demo1234', 10);
users.set('demo-user-001', {
  id:        'demo-user-001',
  name:      'Demo User',
  email:     'demo@imagegen.ai',
  password:  demoHash,
  credits:   120,
  plan:      'free',
  createdAt: new Date().toISOString(),
});