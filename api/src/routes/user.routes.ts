import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /v1/users/:id
router.get('/:id', userController.getUser);

// PATCH /v1/users/:id
router.patch('/:id', userController.updateUser);

// GET /v1/users/:id/reputation
router.get('/:id/reputation', userController.getReputation);

export default router;
