import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

// Extend Express Request to hold validated data
declare global {
  namespace Express {
    interface Request {
      validated?: Record<string, unknown>;
    }
  }
}

/**
 * Validates request body, query, or params against a Zod schema.
 * For 'body', replaces req.body with parsed values.
 * For 'query'/'params', stores parsed values in req.validated.
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (source === 'body') {
      req.body = result.data;
    } else {
      // Express 5 makes query/params read-only, so store on a custom prop
      req.validated = { ...req.validated, [source]: result.data };
    }
    next();
  };
}
