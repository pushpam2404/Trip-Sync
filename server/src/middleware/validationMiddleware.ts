import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/** Turns express-validator failures into a 400 with a per-field list. */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const list = errors.array().map((err) => ({
            field: err.type === 'field' ? err.path : err.type,
            message: err.msg as string,
        }));
        return res.status(400).json({
            success: false,
            message: list[0].message,
            errors: list,
        });
    }
    return next();
};
