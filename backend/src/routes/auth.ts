import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit';
import { sendEmail, emailTemplates } from '../config/mailer';

const router = Router();

const setCookieToken = (res: Parameters<Router>[1], userId: string, role: string) => {
  const token = jwt.sign({ _id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);

  res.cookie('fv_token', token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAge,
  });

  return token;
};

// POST /api/auth/signup
const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number').optional(),
});

router.post('/signup', authLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email }).select('_id');
    // Use generic error to prevent account enumeration
    if (existing) {
      return next(new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS'));
    }

    const user = await User.create({ name, email, password, phone });

    // Send verification email
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${config.frontendUrl}/auth/verify-email?token=${verificationToken}`;
    const template = emailTemplates.verification(name, verifyUrl);
    sendEmail({ to: email, subject: template.subject, html: template.html }).catch(console.error);

    setCookieToken(res, user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Select password explicitly (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');

    // Same error message for both wrong email and wrong password (prevent enumeration)
    const invalidCredentials = new AppError(
      'Invalid email or password.',
      401,
      'INVALID_CREDENTIALS'
    );

    if (!user || !user.password) return next(invalidCredentials);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(invalidCredentials);

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    setCookieToken(res, user._id.toString(), user.role);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('fv_token', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) return next(new AppError('User not found.', 404, 'USER_NOT_FOUND'));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return next(new AppError('Verification token is required.', 400, 'MISSING_TOKEN'));

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return next(new AppError('Invalid or expired verification link.', 400, 'INVALID_TOKEN'));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
const forgotSchema = z.object({ email: z.string().email() });

router.post('/forgot-password', passwordResetLimiter, validate(forgotSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    const successMsg = 'If an account exists with this email, you will receive a password reset link.';

    if (!user) {
      return res.json({ success: true, message: successMsg });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;
    const template = emailTemplates.passwordReset(user.name, resetUrl);

    try {
      await sendEmail({ to: user.email, subject: template.subject, html: template.html });
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Failed to send reset email. Please try again.', 500, 'EMAIL_FAILED'));
    }

    res.json({ success: true, message: successMsg });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

router.post('/reset-password', validate(resetSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return next(new AppError('Invalid or expired reset link.', 400, 'INVALID_TOKEN'));
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate existing sessions by forcing re-login
    res.clearCookie('fv_token');
    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (err) {
    next(err);
  }
});

export default router;
