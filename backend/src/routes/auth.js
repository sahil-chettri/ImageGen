import express from 'express';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  adminLogin,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register',        authLimiter, register);
router.post('/login',           authLimiter, login);
router.post('/verify-otp',      authLimiter, verifyOTP);
router.post('/resend-otp',      authLimiter, resendOTP);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password',  authLimiter, resetPassword);
router.post('/admin/login',     authLimiter, adminLogin);
router.get('/me', protect, getMe);

export default router;