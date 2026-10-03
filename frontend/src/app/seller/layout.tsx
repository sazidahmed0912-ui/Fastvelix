import type { Metadata } from 'next';
import { noIndex } from '@/lib/seo';

export const metadata: Metadata = noIndex();

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
