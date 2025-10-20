// src/routes/api/auth.ts
import express from 'express';  
import { 
  login,
  refreshToken,
  changePassword, 
  forgotPassword,
  verifyOTP,
  resetPassword,
  logout
} from '../../controllers/authController';
import { verifyJWT } from '../../middleware/authMiddleware';

const router = express.Router();    

// Public routes - No authentication required
router.route('/login').post(login);
router.route('/refresh-token').post(refreshToken);
router.route('/forgot-password').post(forgotPassword);
router.route('/verify-otp').post(verifyOTP); // Optional: verify OTP before reset
router.route('/reset-password').post(resetPassword);

// Protected routes - Requires authentication (JWT token)
router.route('/change-password').post(verifyJWT, changePassword);
router.route('/logout').post(verifyJWT, logout);

export default router;