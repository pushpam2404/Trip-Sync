// Vercel entry point. The same Express app that `npm start` runs, wrapped in a
// function handler. The MongoDB connection is opened once per warm instance and
// reused, because a serverless function can be invoked many times per process.
import type { IncomingMessage, ServerResponse } from 'http';
import mongoose from 'mongoose';
import { createApp } from '../src/app';

const app = createApp();
let connecting: Promise<unknown> | null = null;

const connect = (): Promise<unknown> => {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (!connecting) {
        connecting = mongoose
            .connect(process.env.MONGO_URI as string, {
                serverSelectionTimeoutMS: 8000,
                maxPoolSize: 5,
            })
            .catch((error) => {
                connecting = null;
                throw error;
            });
    }
    return connecting;
};

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const missing = ['MONGO_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        return sendJson(res, 500, { success: false, message: 'Server is not configured' });
    }

    const path = (req.url || '/').split('?')[0];
    if (path === '/') {
        return sendJson(res, 200, { success: true, message: 'TripSync API is running', version: '1.1.0' });
    }
    if (path !== '/health') {
        try {
            await connect();
        } catch (error) {
            console.error('MongoDB connection failed:', error instanceof Error ? error.message : error);
            return sendJson(res, 503, { success: false, message: 'Database unavailable' });
        }
    }

    return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
