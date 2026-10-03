import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Search Products — Fashion & Cakes & Bakes',
  description:
    'Search thousands of fashion and bakery products at FastVelix by name, brand or category. Find exactly what you need at the best price.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: `Search Products | ${APP_NAME}`,
    description:
      'Search fashion and bakery products at FastVelix by name, brand or category.',
    type: 'website',
    siteName: APP_NAME,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
