import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Explicit CORS allowlist, comma separated. Defaults to the local frontend so
// that development needs no configuration at all. Override in production with
// CORS_ORIGINS=https://fastvelix.vercel.app,*.vercel.app
const corsOrigins = (
  process.env.CORS_ORIGINS ||
  [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000']
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(',')
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins,

  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fastvelix',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cookie: {
    secret: process.env.COOKIE_SECRET || 'fallback-cookie-secret',
    httpOnly: true,
    // Browsers refuse SameSite=None unless Secure is set as well. Render runs
    // with NODE_ENV=production, so secure and sameSite=none always ship
    // together, which is what lets the session cookie travel from the Vercel
    // domain to this API. Set COOKIE_SAME_SITE=lax to opt back out.
    secure: isProduction,
    sameSite: (
      process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')
    ) as 'strict' | 'lax' | 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'FastVelix <noreply@fastvelix.com>',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  },

  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp'
    ).split(','),
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@fastvelix.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
};

/**
 * Wildcard aware origin check.
 *   "https://fastvelix.vercel.app"  exact match
 *   "*.vercel.app"                  any Vercel deployment subdomain
 *   "*"                             allow every origin (explicit opt in)
 *
 * Requests with no Origin header (curl, mobile apps, server to server) pass.
 */
export const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;

  const candidate = origin.trim().replace(/\/+$/, '').toLowerCase();

  return config.corsOrigins.some((allowed) => {
    const entry = allowed.toLowerCase();
    if (entry === '*') return true;
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(1); // ".vercel.app"
      return candidate === entry.slice(2) || candidate.endsWith(suffix);
    }
    return candidate === entry;
  });
};

// ─── Production secret guard ────────────────────────────────────────────────
// The fallbacks above are development conveniences. Booting in production with
// one still in place means signing sessions with a value that is published in
// the repository, so refuse to start and make the misconfiguration obvious.
if (isProduction) {
  const weak: string[] = [];
  const secrets: Array<[string, string]> = [
    ['JWT_SECRET', config.jwt.secret],
    ['JWT_REFRESH_SECRET', config.jwt.refreshSecret],
    ['COOKIE_SECRET', config.cookie.secret],
  ];

  for (const [name, value] of secrets) {
    if (!value || value.startsWith('fallback-') || value.includes('change-in-production')) {
      weak.push(`${name} is missing or still set to its insecure fallback`);
    }
  }

  if (weak.length > 0) {
    throw new Error(
      'FastVelix API cannot start in production with insecure secrets:\n' +
        weak.map((issue) => `  - ${issue}`).join('\n') +
        '\n\nSet these in the Render dashboard under Environment.'
    );
  }
}
