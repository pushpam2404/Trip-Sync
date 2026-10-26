import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db';
import { createApp, getAllowedOrigins } from './app';

const missing = ['MONGO_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy server/.env.example to server/.env and fill them in.');
    process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set, so the Sakha chat endpoint will return 503.');
}

const port = Number(process.env.PORT) || 3001;

connectDB().then(() => {
    createApp().listen(port, () => {
        console.log(`TripSync API listening on port ${port} (${process.env.NODE_ENV || 'development'})`);
        console.log(`Allowed CORS origins: ${getAllowedOrigins().join(', ')}`);
    });
});
