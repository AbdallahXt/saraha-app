import express from 'express';
import asyncHandler from '../../middleware/async.handler.js';
import * as userService from './user.service.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { uploadSingle } from '../../middleware/upload.js';

const router = express.Router();

router.get('/me', authMiddleware, asyncHandler(userService.getProfile));
router.put('/me', authMiddleware, asyncHandler(userService.updateProfile));
router.post('/logoutAll', authMiddleware, asyncHandler(userService.logoutAll));
router.post('/upload-avatar', authMiddleware, uploadSingle('avatar'), asyncHandler(userService.uploadAvatar));

export default router;
