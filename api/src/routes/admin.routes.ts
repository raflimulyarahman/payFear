import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

// GET /v1/admin/dashboard — admin stats
router.get('/dashboard', adminController.getDashboard);

// POST /v1/admin/tasks/:id/block — block a task
router.post('/tasks/:id/block', adminController.blockTask);

// POST /v1/admin/tasks/:id/unblock — unblock a task
router.post('/tasks/:id/unblock', adminController.unblockTask);

// POST /v1/admin/users/:id/ban — ban a user
router.post('/users/:id/ban', adminController.banUser);

// POST /v1/admin/users/:id/unban — unban a user
router.post('/users/:id/unban', adminController.unbanUser);

// POST /v1/admin/disputes/:id/resolve — resolve dispute
router.post('/disputes/:id/resolve', adminController.resolveDispute);

export default router;
