import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { Request, Response } from 'express';

/** Safe, non-state-changing methods, which get the larger read budget. */
const isReadMethod = (method?: string): boolean =>
  method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

const makeRateLimitError = () => new AppError(
  'Too many requests from this IP. Please try again later.',
  429,
  'RATE_LIMIT_EXCEEDED'
);

// Both limiters below are disabled in development so local iteration never
// trips them.
//
// They are split by method because one shared budget does not survive contact
// with a real storefront: a single homepage visit fires several GETs, and on
// Render every visitor arrives through the same proxy, so all of them drew from
// one bucket. At the old 100 requests per 15 minutes the whole site returned
// 429 within minutes of going live. Reads now get their own, much larger
// budget and writes keep the tighter one.

// Reads, i.e. browsing the catalogue.
export const readLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === 'development' ? 100000 : config.rateLimit.readMax,
  skip: (req) => config.env === 'development' || !isReadMethod(req.method),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res: Response) => {
    const err = makeRateLimitError();
    res.status(429).json({ success: false, code: err.code, message: err.message });
  },
});

// Writes, i.e. anything that changes state.
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === 'development' ? 10000 : config.rateLimit.max,
  skip: (req) => config.env === 'development' || isReadMethod(req.method),
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
