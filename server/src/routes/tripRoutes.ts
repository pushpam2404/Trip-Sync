import express from 'express';
import { body, param } from 'express-validator';
import {
    createTrip,
    getTrips,
    updateTrip,
    deleteTrip,
    clearTrips,
} from '../controllers/tripController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { TRAVEL_MODES } from '../models/Trip';

const router = express.Router();

export const tripValidation = [
    body('origin').isString().trim().notEmpty().withMessage('Origin is required'),
    body('destination').isString().trim().notEmpty().withMessage('Destination is required'),
    body('startDate').notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Start date must be a valid ISO8601 date'),
    body('startTime').isString().trim().notEmpty().withMessage('Start time is required'),
    body('vehicle').optional().isString().trim().isLength({ max: 40 }),
    body('travelers').optional().isInt({ min: 1, max: 100 }).withMessage('Travelers must be between 1 and 100'),
    body('duration').optional().isString().isLength({ max: 40 }),
    body('mode').optional().isIn([...TRAVEL_MODES]).withMessage(`Mode must be one of ${TRAVEL_MODES.join(', ')}`),
    body('stops').optional().isArray({ max: 50 }).withMessage('Stops must be a list'),
    body('stops.*.name').optional().isString().isLength({ max: 200 }),
    body('stops.*.location.lat').optional().isFloat({ min: -90, max: 90 }),
    body('stops.*.location.lng').optional().isFloat({ min: -180, max: 180 }),
    validateRequest,
];

const idParam = [param('id').isMongoId().withMessage('Invalid id'), validateRequest];

router.route('/')
    .post(protect, tripValidation, asyncHandler(createTrip))
    .get(protect, asyncHandler(getTrips))
    .delete(protect, asyncHandler(clearTrips));

router.route('/:id')
    .put(protect, idParam, tripValidation, asyncHandler(updateTrip))
    .delete(protect, idParam, asyncHandler(deleteTrip));

export default router;
