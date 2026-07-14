import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db';

import authRoutes from './routes/authRoutes';
import tripRoutes from './routes/tripRoutes';
import savedRouteRoutes from './routes/savedRouteRoutes';

// Load environment variables
dotenv.config();

// Validate required environment variables at startup
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'] as const;
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file. See .env.example for reference.');
    process.exit(1);
}

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ───
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/saved-routes', savedRouteRoutes);

// Health check
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'TripSync API Server is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime() });
});

// ─── Global Error Handler ───
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
});

// ─── Start Server ───
app.listen(PORT, () => {
    console.log(`🚀 TripSync Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
