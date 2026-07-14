import { Request } from 'express';

/**
 * Extended Express Request with authenticated user data.
 * Used across all protected route controllers.
 */
export interface AuthRequest extends Request {
    user?: any;
}

/**
 * Standard API response envelope.
 * All API responses should follow this shape.
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Array<{ field: string; message: string }>;
}
