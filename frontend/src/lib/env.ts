/**
 * Single source of truth for every backend URL the app builds.
 *
 * NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
 * each one has to be referenced literally as process.env.NAME. A dynamic lookup
 * such as process.env[key] is left as a runtime reference, which resolves to
 * undefined in the browser and silently falls back to localhost.
 *
 * NEXT_PUBLIC_API_URL is conventionally set WITH the /api suffix:
 *
 *   https://fastvelix.onrender.com/api
 *
 * but three call sites need the bare origin instead, and guessing wrong is
 * what broke them:
 *
 *   - socket.io, which the server attaches to the HTTP server at /socket.io/,
 *     not /api/socket.io/. Passing the /api value made every realtime
 *     connection 404.
 *   - the custom cake photo upload, which appended /api to a value that
 *     already ended in /api, producing /api/api/... and a 404.
 *   - the /uploads static directory, served from the origin root rather than
 *     under /api, so image URLs built from the /api value 404.
 *
 * Deriving both shapes in one place removes the chance of getting it wrong
 * again.
 */

// Literal references, required for build-time inlining.
const RAW_API_URL: string =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const RAW_APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const APP_NAME: string = process.env.NEXT_PUBLIC_APP_NAME || 'FastVelix';

/** Drop trailing slashes so the joins below can never produce a double slash. */
const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

/**
 * Backend origin with no path at all: https://fastvelix.onrender.com
 *
 * Use this for socket.io and for /uploads. Tolerates NEXT_PUBLIC_API_URL being
 * set with or without the /api suffix, and with a trailing slash.
 */
export const API_ORIGIN: string = trimTrailingSlash(
  RAW_API_URL.replace(/\/api\/?$/, '')
);

/** REST base including the prefix: https://fastvelix.onrender.com/api */
export const API_BASE: string = `${API_ORIGIN}/api`;

/** Public site origin, for canonical URLs, the sitemap and robots. */
export const SITE_URL: string = trimTrailingSlash(RAW_APP_URL);

/**
 * Absolute URL for a file the backend serves from its /uploads directory.
 *
 * The API returns these paths already relative ("/uploads/cake.jpg"), which a
 * browser would resolve against the frontend origin and 404 on. Absolute URLs
 * are passed through untouched so seeded Unsplash and Cloudinary images keep
 * working.
 */
export const uploadUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const file = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${file}`;
};
