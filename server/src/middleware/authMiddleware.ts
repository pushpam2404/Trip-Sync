import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/token';

/** Requires `Authorization: Bearer <jwt>` and attaches the matching user to the request. */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const [scheme, token] = header ? header.split(' ') : [];

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const userId = verifyToken(token);
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }

    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authorized, user no longer exists' });
        }
        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};
