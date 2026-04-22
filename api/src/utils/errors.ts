export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ============================================================
// Auth Errors
// ============================================================
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super(401, 'TOKEN_EXPIRED', 'Session expired. Please log in again.');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, 'FORBIDDEN', message);
  }
}

// ============================================================
// Resource Errors
// ============================================================
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(404, `${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`, msg);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(409, code, message);
  }
}

// ============================================================
// Validation Errors
// ============================================================
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

// ============================================================
// Task Errors
// ============================================================
export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(400, 'INVALID_TRANSITION', `Cannot transition from '${from}' to '${to}'`);
  }
}

export class TaskBlockedError extends AppError {
  constructor() {
    super(403, 'TASK_BLOCKED', 'This task has been blocked by moderation');
  }
}

export class ContentBlockedError extends AppError {
  constructor(reasons: string[]) {
    super(400, 'CONTENT_BLOCKED', 'Task contains prohibited content', { reasons });
  }
}

// ============================================================
// User Errors
// ============================================================
export class UserBannedError extends AppError {
  constructor() {
    super(403, 'USER_BANNED', 'Your account has been suspended');
  }
}

// ============================================================
// Rate Limit
// ============================================================
export class RateLimitError extends AppError {
  constructor() {
    super(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
  }
}
