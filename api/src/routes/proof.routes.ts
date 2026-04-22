import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as proofController from '../controllers/proof.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST /v1/tasks/:taskId/proofs — submit proof
router.post('/', proofController.submitProof);

// GET /v1/tasks/:taskId/proofs — list proofs for task
router.get('/', proofController.listProofs);

export default router;
