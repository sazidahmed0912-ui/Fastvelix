import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { APP_NAME, BASE_URL, breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: {
    default: 'Fashion Store — Men, Women & Kids Clothing',
    template: '%s | FastVelix',
  },
  description:
    'Shop the latest fashion at FastVelix — men, women and kids clothing, footwear and accessories. Premium quality, great prices and fast delivery across India.',
  alternates: { canonical: '/fashion' },
  openGraph: {
    title: `Fashion Store | ${APP_NAME}`,
    description:
      'Shop the latest fashion — men, women and kids clothing, footwear and accessories.',
    url: `${BASE_URL}/fashion`,
    type: 'website',
    siteName: APP_NAME,
  },
};

export default function FashionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Fashion', path: '/fashion' },
        ])}
      />
      {children}
    </>
  );
}
