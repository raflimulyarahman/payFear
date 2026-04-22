import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as reviewController from '../controllers/review.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST /v1/tasks/:taskId/reviews — submit review
router.post('/', reviewController.submitReview);

// GET /v1/tasks/:taskId/reviews — list reviews for task
router.get('/', reviewController.listReviews);

// POST /v1/tasks/:taskId/approve — requester approves proof
router.post('/approve', reviewController.approveTask);

// POST /v1/tasks/:taskId/dispute — requester disputes
router.post('/dispute', reviewController.disputeTask);

export default router;
