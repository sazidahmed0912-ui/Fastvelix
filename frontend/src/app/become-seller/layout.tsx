import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Become a Seller — Sell on FastVelix',
  description: `Grow your business by selling fashion and bakery products on ${APP_NAME}. Simple onboarding, powerful seller tools and pan-India reach.`,
  alternates: { canonical: '/become-seller' },
};

export default function BecomeSellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
