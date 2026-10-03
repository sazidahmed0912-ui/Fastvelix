import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { Response } from 'express';

const makeRateLimitError = () => new AppError(
  'Too many requests from this IP. Please try again later.',
  429,
  'RATE_LIMIT_EXCEEDED'
);

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === 'development' ? 10000 : config.rateLimit.max,
  skip: () => config.env === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res: Response) => {
    const err = makeRateLimitError();
    res.status(429).json({ success: false, code: err.code, message: err.message });
  },
});

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'development' ? 1000 : config.rateLimit.authMax,
  skip: () => config.env === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res: Response) => {
    const err = new AppError(
      'Too many login attempts. Please try again in 15 minutes.',
      429,
      'AUTH_RATE_LIMIT'
    );
    res.status(429).json({ success: false, code: err.code, message: err.message });
  },
});

// Strict limit for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: (_req, res: Response) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests. Please try again in 1 hour.',
    });
  },
});

// Upload rate limit
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler: (_req, res: Response) => {
    res.status(429).json({
      success: false,
      code: 'UPLOAD_RATE_LIMIT',
      message: 'Too many uploads. Please slow down.',
    });
  },
});
