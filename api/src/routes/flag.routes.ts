import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as flagController from '../controllers/flag.controller.js';

const router = Router();

router.use(authenticate);

// POST /v1/flags — report a task or user
router.post('/', flagController.createFlag);

// GET /v1/flags — list all flags (admin)
router.get('/', requireRole('ADMIN'), flagController.listFlags);

// PATCH /v1/flags/:id — resolve a flag (admin)
router.patch('/:id', requireRole('ADMIN'), flagController.resolveFlag);

export default router;
