import type { Metadata } from 'next';
import { noIndex } from '@/lib/seo';
import AccountShell from '@/components/AccountShell';
import RequireAuth from '@/components/RequireAuth';

export const metadata: Metadata = noIndex();

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <AccountShell>{children}</AccountShell>
    </RequireAuth>
  );
}
