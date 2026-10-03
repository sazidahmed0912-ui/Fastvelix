import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: `Review the items in your ${APP_NAME} shopping cart, apply coupons and proceed to a fast, secure checkout.`,
  alternates: { canonical: '/cart' },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
