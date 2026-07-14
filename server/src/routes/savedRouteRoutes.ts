import express from 'express';
import { body } from 'express-validator';
import {
    saveRoute,
    getSavedRoutes,
    deleteSavedRoute,
} from '../controllers/savedRouteController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

const router = express.Router();

const savedRouteValidation = [
    body('origin')
        .trim()
        .notEmpty().withMessage('Origin is required'),
    body('destination')
        .trim()
        .notEmpty().withMessage('Destination is required'),
    body('stay')
        .optional()
        .trim(),
    validateRequest
];

router.route('/')
    .post(protect, savedRouteValidation, saveRoute)
    .get(protect, getSavedRoutes);

router.route('/:id')
    .delete(protect, deleteSavedRoute);

export default router;
