import type { Metadata } from 'next';
import { noIndex } from '@/lib/seo';
import RequireAuth from '@/components/RequireAuth';

export const metadata: Metadata = noIndex();

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mirrors the backend's `authorize('ADMIN', 'SUPER_ADMIN')` on the admin router.
  return <RequireAuth roles={['ADMIN', 'SUPER_ADMIN']}>{children}</RequireAuth>;
}
