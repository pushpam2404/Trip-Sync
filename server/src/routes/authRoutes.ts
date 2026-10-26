import express from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { registerUser, loginUser, updateProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { normalizePhone } from '../utils/phone';

const router = express.Router();

// Only failed attempts count, so signing up or logging in normally never hits this.
const credentialsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, please try again later.' },
});

const phoneField = body('phone')
    .isString().withMessage('Phone number is required')
    .bail()
    .custom((value) => normalizePhone(value) !== null)
    .withMessage('Enter a valid 10-digit mobile number, optionally starting with +91');

export const passwordRules = body('password')
    .isString().withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character');

const nameField = body('name')
    .isString().withMessage('Name is required')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name must contain only letters and spaces');

const vehicleFields = (list: 'twoWheelers' | 'fourWheelers') => [
    body(list).optional().isArray({ max: 20 }).withMessage(`${list} must be a list of at most 20 vehicles`),
    body(`${list}.*.regNumber`)
        .isString().withMessage('Vehicle registration number is required')
        .bail()
        .trim()
        .isLength({ min: 1, max: 20 }).withMessage('Vehicle registration number must be 1 to 20 characters'),
    body(`${list}.*.id`).optional().isString().isLength({ max: 64 }),
];

export const registerValidation = [
    nameField,
    phoneField,
    passwordRules,
    ...vehicleFields('twoWheelers'),
    ...vehicleFields('fourWheelers'),
    validateRequest,
];

export const loginValidation = [
    body('phone').isString().withMessage('Phone number is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
    validateRequest,
];

const profileValidation = [
    nameField.optional(),
    ...vehicleFields('twoWheelers'),
    ...vehicleFields('fourWheelers'),
    validateRequest,
];

router.post('/signup', credentialsLimiter, registerValidation, asyncHandler(registerUser));
router.post('/login', credentialsLimiter, loginValidation, asyncHandler(loginUser));
router.patch('/profile', protect, profileValidation, asyncHandler(updateProfile));

export default router;
