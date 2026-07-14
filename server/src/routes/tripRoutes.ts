import express from 'express';
import { body } from 'express-validator';
import {
    createTrip,
    getTrips,
    updateTrip,
    deleteTrip,
} from '../controllers/tripController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

const router = express.Router();

// Validation schema for creating a trip
const tripValidation = [
    body('origin')
        .trim()
        .notEmpty().withMessage('Origin is required'),
    body('destination')
        .trim()
        .notEmpty().withMessage('Destination is required'),
    body('startDate')
        .notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Start date must be a valid ISO8601 date'),
    body('startTime')
        .trim()
        .notEmpty().withMessage('Start time is required'),
    body('vehicle')
        .optional()
        .trim(),
    body('travelers')
        .optional()
        .isInt({ min: 1 }).withMessage('Travelers must be at least 1'),
    body('tripType')
        .optional()
        .isIn(['one-way', 'round-trip']).withMessage('Trip type must be either one-way or round-trip'),
    validateRequest
];

router.route('/')
    .post(protect, tripValidation, createTrip)
    .get(protect, getTrips);

router.route('/:id')
    .put(protect, tripValidation, updateTrip)
    .delete(protect, deleteTrip);

export default router;
