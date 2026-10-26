import { Request, Response, NextFunction, RequestHandler } from 'express';

/** Lets async handlers throw; Express 4 does not catch rejected promises on its own. */
export const asyncHandler =
    (fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
    (req, res, next) => {
        fn(req, res, next).catch(next);
    };

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export const notFound = (_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Route not found' });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    if (err?.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'Request body too large' });
    }
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'Malformed JSON body' });
    }
    if (err?.code === 11000) {
        return res.status(409).json({ success: false, message: 'That value is already in use' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
};
