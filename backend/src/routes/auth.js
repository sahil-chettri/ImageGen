import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import {
  register, registerValidators,
  login,    loginValidators,
  getMe, updateMe,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', authLimiter, registerValidators, register);
router.post('/login',    authLimiter, loginValidators,    login);
router.get('/me',        authenticate, getMe);
router.put('/me',        authenticate, updateMe);

export default router;