import express from 'express';
import { body } from 'express-validator';
import { registerUser, loginUser } from '../controllers/authController';
import { validateRequest } from '../middleware/validationMiddleware';

const router = express.Router();

// Validation schema for User Registration
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Name must contain only alphabets and spaces'),
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^\+91\s\d{10}$|^\d{10}$/).withMessage('Enter a valid 10-digit mobile number, optionally starting with +91'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
    body('twoWheelers')
        .optional()
        .isArray().withMessage('twoWheelers must be an array'),
    body('twoWheelers.*.regNumber')
        .optional()
        .trim()
        .notEmpty().withMessage('Vehicle registration number is required'),
    body('fourWheelers')
        .optional()
        .isArray().withMessage('fourWheelers must be an array'),
    body('fourWheelers.*.regNumber')
        .optional()
        .trim()
        .notEmpty().withMessage('Vehicle registration number is required'),
    validateRequest
];

// Validation schema for Login
const loginValidation = [
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required'),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validateRequest
];

router.post('/signup', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);

export default router;
