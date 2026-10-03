import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: `Complete your purchase securely at ${APP_NAME} with multiple payment options including UPI, cards, netbanking and COD.`,
  alternates: { canonical: '/checkout' },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
