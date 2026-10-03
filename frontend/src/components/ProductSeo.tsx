import JsonLd from '@/components/JsonLd';
import {
  breadcrumbJsonLd,
  productJsonLd,
  type SeoProduct,
  type TopCategory,
} from '@/lib/seo';

interface ProductSeoProps {
  product: SeoProduct | null;
  category: TopCategory;
}

export default function ProductSeo({ product, category }: ProductSeoProps) {
  if (!product) return null;

  const label = category === 'FASHION' ? 'Fashion' : 'Cakes & Bakes';

  return (
    <>
      <JsonLd data={productJsonLd(product, category)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          {
            name: label,
            path: `/${category.toLowerCase()}`,
          },
          {
            name: product.title,
            path: `/${category.toLowerCase()}/${product.slug}`,
          },
        ])}
      />
    </>
  );
}
