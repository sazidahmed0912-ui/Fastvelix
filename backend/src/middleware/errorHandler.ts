import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { config } from '../config';
import mongoose from 'mongoose';

interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: Record<string, string>[];
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong. Please try again.';
  let errors: Record<string, string>[] | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid resource ID format.';
  } else if ((err as any).code === 11000 || (err as any).code === '11000') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    const field = Object.keys((err as any).keyValue || {})[0] || 'field';
    message = `${field} already exists.`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Session has expired. Please log in again.';
  }

  // Log server errors in development
  if (config.env === 'development' && statusCode >= 500) {
    console.error('❌ Server Error:', err);
  }

  const response: ErrorResponse = {
    success: false,
    code,
    message,
    ...(errors && { errors }),
    // Only include stack in development
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, 404, 'NOT_FOUND'));
};
