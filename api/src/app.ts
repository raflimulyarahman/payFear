import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import taskRoutes from './routes/task.routes.js';
import proofRoutes from './routes/proof.routes.js';
import reviewRoutes from './routes/review.routes.js';
import flagRoutes from './routes/flag.routes.js';
import adminRoutes from './routes/admin.routes.js';
import escrowRoutes from './routes/escrow.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import siweRoutes from './routes/siwe.routes.js';

export function createApp() {
  const app = express();

  // ──────────────────────────────────────────────
  // Global middleware
  // ──────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(generalLimiter);

  // Request logging
  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // ──────────────────────────────────────────────
  // Health check
  // ──────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ──────────────────────────────────────────────
  // API routes (v1)
  // ──────────────────────────────────────────────
  const v1 = express.Router();
  v1.use('/auth', authRoutes);
  v1.use('/users', userRoutes);
  v1.use('/tasks', taskRoutes);
  v1.use('/tasks/:taskId/proofs', proofRoutes);
  v1.use('/tasks/:taskId/reviews', reviewRoutes);
  v1.use('/flags', flagRoutes);
  v1.use('/admin', adminRoutes);
  v1.use('/escrow', escrowRoutes);
  v1.use('/wallet', walletRoutes);
  v1.use('/siwe', siweRoutes);

  app.use('/v1', v1);

  // ──────────────────────────────────────────────
  // 404 handler
  // ──────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
        statusCode: 404,
      },
    });
  });

  // ──────────────────────────────────────────────
  // Global error handler (must be last)
  // ──────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
