import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/seller',
          '/account',
          '/orders',
          '/forgot-password',
          '/reset-password',
          '/api',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
