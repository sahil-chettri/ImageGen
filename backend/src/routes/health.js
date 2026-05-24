import { Router } from 'express';
import pool from '../db.js';

const router  = Router();
const started = new Date().toISOString();

router.get('/', async (_req, res) => {
  const usersCount       = await pool.query('SELECT COUNT(*) FROM users');
  const generationsCount = await pool.query('SELECT COUNT(*) FROM generations');

  res.json({
    success:   true,
    status:    'ok',
    uptime:    process.uptime().toFixed(1) + 's',
    startedAt: started,
    env:       process.env.NODE_ENV || 'development',
    provider:  process.env.AI_PROVIDER || 'mock',
    stats: {
      users:       parseInt(usersCount.rows[0].count),
      generations: parseInt(generationsCount.rows[0].count),
    },
  });
});

export default router;