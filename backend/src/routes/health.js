import { Router } from 'express';
import { users, generations } from '../db.js';

const router  = Router();
const started = new Date().toISOString();

router.get('/', (_req, res) => {
  res.json({
    success:   true,
    status:    'ok',
    uptime:    process.uptime().toFixed(1) + 's',
    startedAt: started,
    env:       process.env.NODE_ENV || 'development',
    provider:  process.env.AI_PROVIDER || 'mock',
    stats: {
      users:       users.size,
      generations: generations.size,
    },
  });
});

export default router;