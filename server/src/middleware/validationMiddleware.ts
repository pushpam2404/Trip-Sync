import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * validationMiddleware — Inspects validation results from express-validator.
 * Returns a detailed 400 Bad Request envelope if validation failures occur.
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Input validation failed',
            errors: errors.array().map(err => ({
                field: err.type === 'field' ? err.path : err.type,
                message: err.msg
            }))
        });
    }
    return next();
};
