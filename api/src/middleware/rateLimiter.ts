import rateLimit from 'express-rate-limit';

/** General API rate limit: 100 requests per minute */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      statusCode: 429,
    },
  },
});

/** Auth rate limit: 30 requests per minute */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please wait.',
      statusCode: 429,
    },
  },
});

/** Strict rate limit for sensitive ops: 10 per minute */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded for this action.',
      statusCode: 429,
    },
  },
});
