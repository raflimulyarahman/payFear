import type { Response } from 'express';

interface SuccessOptions<T> {
  data: T;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, options: SuccessOptions<T>): void {
  const { data, statusCode = 200, meta } = options;
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta
): void {
  res.status(200).json({
    success: true,
    data,
    meta: pagination,
  });
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, { data, statusCode: 201 });
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
