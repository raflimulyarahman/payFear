import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';

const router = Router();

// Apply stricter rate limit to all auth routes
router.use(authLimiter);

// POST /v1/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /v1/auth/logout
router.post('/logout', authController.logout);

// GET /v1/auth/me
router.get('/me', authController.me);

export default router;
