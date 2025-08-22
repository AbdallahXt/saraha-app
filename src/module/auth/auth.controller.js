import express from 'express';
import asyncHandler from '../../middleware/async.handler.js';
import * as authService from './auth.service.js';
import * as authValidation from './auth.validation.js';
import { authMiddleware } from './auth.middleware.js';
import { testEmailConnection } from '../../utils/email/index.js';

const router = express.Router();


router.post('/register', authValidation.register, asyncHandler(authService.register));
router.post('/verify-account', authValidation.verifyAccount, asyncHandler(authService.verifyAccount));
router.post('/resend-otp', authValidation.resendOtp, asyncHandler(authService.resendOtp));
router.post('/login', authValidation.login, asyncHandler(authService.login));
router.post('/google', authValidation.google, asyncHandler(authService.googleLogin));

router.post('/forgot-password', authValidation.forgotPassword, asyncHandler(authService.forgotPassword));
router.post('/reset-password', authValidation.resetPassword, asyncHandler(authService.resetPassword));
router.post('/request-password-change-otp', authMiddleware, asyncHandler(authService.requestPasswordChangeOtp));
router.post('/change-password', authMiddleware, authValidation.changePassword, asyncHandler(authService.changePassword));


router.post('/logout', asyncHandler(authService.logout));
router.post('/revoke', asyncHandler(authService.revokeToken));

router.get('/test-email', asyncHandler(async (req, res) => {
  const result = await testEmailConnection();
  res.json(result);
}));

export default router;
