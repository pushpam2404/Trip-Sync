import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { body } from 'express-validator';
import { chatWithSakha, sakhaStatus } from '../controllers/sakhaController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = express.Router();

// Each Gemini call costs quota, so limit per signed-in user rather than per IP.
const sakhaLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 12,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req as AuthRequest).user?._id.toString() ?? ipKeyGenerator(req.ip ?? ''),
    message: { success: false, message: 'Slow down a little, Sakha needs a moment between messages.' },
});

export const sakhaValidation = [
    body('message').isString().trim().isLength({ min: 1, max: 2000 })
        .withMessage('Message must be 1 to 2000 characters'),
    body('history').optional().isArray({ max: 40 }).withMessage('History must be a list'),
    body('history.*.role').isIn(['user', 'model']),
    body('history.*.text').isString().isLength({ max: 4000 }),
    validateRequest,
];

router.get('/', protect, asyncHandler(sakhaStatus));
router.post('/', protect, sakhaLimiter, sakhaValidation, asyncHandler(chatWithSakha));

export default router;
