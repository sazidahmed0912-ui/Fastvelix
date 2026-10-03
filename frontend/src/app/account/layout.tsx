import type { Metadata } from 'next';
import { noIndex } from '@/lib/seo';
import AccountShell from '@/components/AccountShell';

export const metadata: Metadata = noIndex();

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountShell>{children}</AccountShell>;
}
