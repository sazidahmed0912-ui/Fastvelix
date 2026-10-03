import type { Metadata } from 'next';
import ProductSeo from '@/components/ProductSeo';
import { fetchProductBySlug, productMetadata } from '@/lib/seo';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    return { title: 'Product Not Found' };
  }
  return productMetadata(product, 'FASHION');
}

export default async function FashionProductLayout({
  children,
  params,
}: Props) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  return (
    <>
      <ProductSeo product={product} category="FASHION" />
      {children}
    </>
  );
}
