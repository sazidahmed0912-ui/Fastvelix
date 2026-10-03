import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Create Account',
  description: `Create your free ${APP_NAME} account to shop fashion and groceries online with exclusive deals and fast checkout.`,
  alternates: { canonical: '/signup' },
  robots: { index: false, follow: false },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
