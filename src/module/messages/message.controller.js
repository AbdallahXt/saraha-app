import express from 'express';
import asyncHandler from '../../middleware/async.handler.js';
import * as messageService from './message.service.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

router.post('/:username', asyncHandler(messageService.sendMessage));
router.get('/my', authMiddleware, asyncHandler(messageService.getMyMessages));
router.delete('/:id', authMiddleware, asyncHandler(messageService.deleteMessage));

export default router;
