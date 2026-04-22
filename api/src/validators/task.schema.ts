import { z } from 'zod';

const taskBaseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum(['PHONE_CALLS', 'SOCIAL', 'RETURN_REFUND', 'NEGOTIATION', 'ADMIN_TASK', 'OTHER']),
  location: z.enum(['online', 'offline']),
  address: z.string().min(5).max(200).optional(),
  budget: z.number().min(5, 'Minimum budget is $5').max(500, 'Maximum budget is $500'),
  deadline: z.string().datetime(),
  urgency: z.enum(['normal', 'urgent']).default('normal'),
  proofType: z.enum(['SCREENSHOT', 'PHOTO', 'TEXT', 'VIDEO']),
  specialInstructions: z.string().max(500).optional(),
});

export const createTaskSchema = taskBaseSchema.refine(
  (data) => data.location !== 'offline' || (data.address && data.address.length >= 5),
  { message: 'Address is required for offline tasks', path: ['address'] }
);

export const updateTaskSchema = taskBaseSchema.partial();

export const listTasksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum([
    'DRAFT', 'OPEN', 'ACCEPTED', 'IN_PROGRESS', 'PROOF_SUBMITTED',
    'UNDER_REVIEW', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED', 'BLOCKED'
  ]).optional(),
  category: z.enum(['PHONE_CALLS', 'SOCIAL', 'RETURN_REFUND', 'NEGOTIATION', 'ADMIN_TASK', 'OTHER']).optional(),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  search: z.string().max(100).optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().max(500).optional(),
  location: z.enum(['online', 'offline']).optional(),
  sort: z.enum(['newest', 'oldest', 'budget_high', 'budget_low', 'deadline']).default('newest'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
