import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import * as taskController from '../controllers/task.controller.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, listTasksSchema } from '../validators/task.schema.js';

const router = Router();

// GET /v1/tasks — list with filters (optional auth for public browse)
router.get('/', optionalAuth, validate(listTasksSchema, 'query'), taskController.listTasks);

// GET /v1/tasks/:id — get task detail
router.get('/:id', optionalAuth, taskController.getTask);

// All routes below require authentication
router.use(authenticate);

// POST /v1/tasks — create new task (draft)
router.post('/', validate(createTaskSchema), taskController.createTask);

// PATCH /v1/tasks/:id — update draft task
router.patch('/:id', taskController.updateTask);

// DELETE /v1/tasks/:id — delete draft task
router.delete('/:id', taskController.deleteTask);

// POST /v1/tasks/:id/publish — publish draft → open
router.post('/:id/publish', taskController.publishTask);

// POST /v1/tasks/:id/accept — executor accepts
router.post('/:id/accept', taskController.acceptTask);

// POST /v1/tasks/:id/start — executor starts working
router.post('/:id/start', taskController.startTask);

// POST /v1/tasks/:id/cancel — cancel task
router.post('/:id/cancel', taskController.cancelTask);

export default router;
