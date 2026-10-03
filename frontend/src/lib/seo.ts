import { cache } from 'react';
import type { Metadata } from 'next';

export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FastVelix';

export const APP_DESCRIPTION =
  'Design custom cakes, discover fresh bakes and order beautiful treats for every celebration with FastVelix. ' +
  'Shop premium fashion trends alongside custom cakes, cupcakes, pastries and gift hampers — delivered with care.';

export const KEYWORDS = [
  'FastVelix',
  'custom cakes online',
  'cakes and bakes',
  'birthday cake delivery',
  'photo cake customizer',
  'fresh bakery online',
  'cupcakes and pastries',
  'mens fashion',
  'womens clothing',
  'celebration hampers',
];

export interface SeoProduct {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  brand?: string;
  thumbnail?: string;
  images?: string[];
  salePrice?: number;
  basePrice?: number;
  totalStock?: number;
  ratings?: { average?: number; count?: number };
  topLevelCategory?: 'FASHION' | 'CAKES_AND_BAKES';
  createdAt?: string;
  updatedAt?: string;
}

export type TopCategory = 'FASHION' | 'CAKES_AND_BAKES';

export const fetchProductBySlug = cache(
  async (slug: string): Promise<SeoProduct | null> => {
    try {
      const res = await fetch(`${API_URL}/products/${slug}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        success: boolean;
        product: SeoProduct;
      };
      return data.success ? data.product : null;
    } catch {
      return null;
    }
  }
);

export function noIndex(): Metadata {
  return {
    title: { absolute: 'FastVelix' },
    robots: { index: false, follow: false },
  };
}

export function productMetadata(
  product: SeoProduct,
  category: TopCategory
): Metadata {
  const categoryPath = category === 'CAKES_AND_BAKES' ? 'cakes-and-bakes' : 'fashion';
  const url = `${BASE_URL}/${categoryPath}/${product.slug}`;
  const images = [product.thumbnail, ...(product.images || [])].filter(
    Boolean
  ) as string[];
  const description =
    product.description?.replace(/\s+/g, ' ').slice(0, 158) ||
    `Buy ${product.title} online at FastVelix. Best prices, quick delivery.`;

  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${product.title} | ${APP_NAME}`,
      description,
      url,
      type: 'website',
      siteName: APP_NAME,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | ${APP_NAME}`,
      description,
      images,
    },
  };
}

export function productJsonLd(
  product: SeoProduct,
  category: TopCategory
): Record<string, unknown> {
  const categoryPath = category === 'CAKES_AND_BAKES' ? 'cakes-and-bakes' : 'fashion';
  const url = `${BASE_URL}/${categoryPath}/${product.slug}`;
  const images = [product.thumbnail, ...(product.images || [])].filter(
    Boolean
  ) as string[];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: images,
    description:
      product.description?.replace(/\s+/g, ' ').slice(0, 300) ||
      `${product.title} — Buy online at FastVelix.`,
    url,
    brand: product.brand
      ? { '@type': 'Brand', name: product.brand }
      : { '@type': 'Brand', name: APP_NAME },
    ...(product.ratings?.count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Math.min(5, product.ratings.average || 0),
            reviewCount: product.ratings.count,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: product.salePrice ?? product.basePrice ?? 0,
      availability:
        (product.totalStock ?? 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : `${BASE_URL}${item.path}`,
    })),
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.ico`,
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
