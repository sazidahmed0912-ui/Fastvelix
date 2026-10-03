import type { Metadata } from 'next';
import { noIndex } from '@/lib/seo';
import RequireAuth from '@/components/RequireAuth';

export const metadata: Metadata = noIndex();

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mirrors the backend's `authorize('SELLER', 'ADMIN', 'SUPER_ADMIN')`.
  return <RequireAuth roles={['SELLER', 'ADMIN', 'SUPER_ADMIN']}>{children}</RequireAuth>;
}
