import express from 'express';
import { body, param } from 'express-validator';
import { saveRoute, getSavedRoutes, deleteSavedRoute } from '../controllers/savedRouteController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

const savedRouteValidation = [
    body('origin').isString().trim().notEmpty().withMessage('Origin is required'),
    body('destination').isString().trim().notEmpty().withMessage('Destination is required'),
    body('stay').optional().isString().trim(),
    validateRequest,
];

router.route('/')
    .post(protect, savedRouteValidation, asyncHandler(saveRoute))
    .get(protect, asyncHandler(getSavedRoutes));

router.delete(
    '/:id',
    protect,
    [param('id').isMongoId().withMessage('Invalid id'), validateRequest],
    asyncHandler(deleteSavedRoute),
);

export default router;
