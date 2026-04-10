import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routes/auth';
import recipesRouter from './routes/recipes';
import moderationRouter from './routes/moderation';
import searchRouter from './routes/search';
import feedRouter from './routes/feed';
import aiRouter from './routes/ai';
import subscriptionsRouter from './routes/subscriptions';
import webhooksRouter from './routes/webhooks';
import notificationsRouter from './routes/notifications';
import academyRouter from './routes/academy';
import marketplaceRouter from './routes/marketplace';
import profileRouter from './routes/profile';

dotenv.config();

// Connect MongoDB (optional - social feed features)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.warn('MongoDB unavailable (social feed disabled):', err.message));
}

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim());
    // Also always allow localhost variants for dev
    const devOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
    if (!origin || [...allowed, ...devOrigins].includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Webhook routes MUST be mounted before express.json() so the raw body is
// available for HMAC-SHA256 signature verification (Req 13.8, 19.5).
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

// Body parsing (applied after webhook routes)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRouter);

// Recipe CRUD, ratings, comments
app.use('/api/recipes', recipesRouter);

// Content moderation queue
app.use('/api/moderation', moderationRouter);

// Search routes (Tasks 7.1, 7.5, 7.7)
app.use('/api/search', searchRouter);

// Social feed routes (Tasks 8.1, 8.2, 8.4, 8.6, 8.8)
app.use('/api/feed', feedRouter);

// AI routes — Recipe Fixer, Dish Scanner, Audio Guide (Tasks 9.1, 9.4, 9.7, 9.8)
app.use('/api/ai', aiRouter);

// Subscription creation (Task 11.1)
app.use('/api/subscriptions', subscriptionsRouter);

// Notifications (Tasks 12.1, 12.3, 12.4, 12.5)
app.use('/api/notifications', notificationsRouter);

// Academy — courses, lessons, progress, bookmarks (Tasks 13.1)
app.use('/api/academy', academyRouter);

// Marketplace — ingredient sourcing listings (Tasks 13.6)
app.use('/api/marketplace', marketplaceRouter);

// User profile (Tasks 15.1, 15.3, 15.4)
app.use('/api/profile', profileRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      retryable: true,
    },
  });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
