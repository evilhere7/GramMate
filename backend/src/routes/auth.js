import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  startGoogleAuth,
  googleAuthCallback,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/google/redirect', startGoogleAuth);
router.get('/google/callback', googleAuthCallback);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);

export default router;
