import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import tripRoutes from './routes/tripRoutes';
import savedRouteRoutes from './routes/savedRouteRoutes';
import sakhaRoutes from './routes/sakhaRoutes';
import { notFound, errorHandler } from './middleware/errorHandler';

const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

export const getAllowedOrigins = (): string[] =>
    (process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : DEFAULT_ORIGINS
    )
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean);

export const createApp = () => {
    const app = express();

    // Render and Vercel sit behind a proxy; without this every client shares one IP
    // and the rate limiters below would count all users together.
    app.set('trust proxy', 1);

    app.use(helmet());

    const allowedOrigins = getAllowedOrigins();
    app.use(
        cors({
            origin: (origin, callback) => {
                // No Origin header: curl, health checks, server to server calls.
                if (!origin) return callback(null, true);
                callback(null, allowedOrigins.includes(origin.replace(/\/$/, '')));
            },
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }),
    );

    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000,
            limit: 300,
            standardHeaders: true,
            legacyHeaders: false,
            message: { success: false, message: 'Too many requests, please try again later.' },
        }),
    );
    app.use(express.json({ limit: '100kb' }));

    app.get('/', (_req, res) => {
        res.json({ success: true, message: 'TripSync API is running', version: '1.1.0' });
    });
    app.get('/health', (_req, res) => {
        res.json({ status: 'healthy', uptime: process.uptime() });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/trips', tripRoutes);
    app.use('/api/saved-routes', savedRouteRoutes);
    app.use('/api/sakha', sakhaRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
};
