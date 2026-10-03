import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, UserRole } from '../models/User';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Read token from httpOnly cookie first, then Authorization header
    const token =
      req.cookies?.fv_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      _id: string;
      email: string;
      role: UserRole;
    };

    // Verify user still exists and is active
    const user = await User.findById(decoded._id).select('_id name email role isActive');
    if (!user || !user.isActive) {
      return next(new AppError('User account not found or has been deactivated.', 401));
    }

    // CRITICAL: role comes from DB, never from the token payload directly
    req.user = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid session token. Please log in again.', 401));
    }
    next(err);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of: ${roles.join(', ')}`,
          403
        )
      );
    }
    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.fv_token;
    if (!token) return next();

    const decoded = jwt.verify(token, config.jwt.secret) as {
      _id: string;
      role: UserRole;
    };

    const user = await User.findById(decoded._id).select('_id name email role isActive');
    if (user?.isActive) {
      req.user = {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }
    next();
  } catch {
    next(); // silently continue without auth
  }
};
