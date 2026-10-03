import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Login to Your Account',
  description: `Sign in to your ${APP_NAME} account to track orders, manage addresses and enjoy faster checkout.`,
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
