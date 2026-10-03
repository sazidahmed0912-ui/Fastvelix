import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const STATIC_ROUTES: {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/fashion', changeFrequency: 'daily', priority: 0.9 },
  { path: '/cakes-and-bakes', changeFrequency: 'daily', priority: 0.9 },
  { path: '/cakes-and-bakes/custom-cake', changeFrequency: 'daily', priority: 0.9 },
  { path: '/cakes-and-bakes/cakes', changeFrequency: 'daily', priority: 0.8 },
  { path: '/cakes-and-bakes/cupcakes', changeFrequency: 'daily', priority: 0.8 },
  { path: '/cakes-and-bakes/pastries', changeFrequency: 'daily', priority: 0.8 },
  { path: '/cakes-and-bakes/gifts', changeFrequency: 'daily', priority: 0.8 },
  { path: '/search', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/cart', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/checkout', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/become-seller', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/signup', changeFrequency: 'monthly', priority: 0.3 },
];

interface Product {
  slug: string;
  topLevelCategory: 'FASHION' | 'CAKES_AND_BAKES';
  createdAt?: string;
}

async function fetchAllProducts(): Promise<Product[]> {
  const products: Product[] = [];
  const limit = 48;
  let page = 1;
  let pages = 1;

  do {
    const res = await fetch(
      `${API_URL}/products?status=ACTIVE&page=${page}&limit=${limit}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) break;

    const data = (await res.json()) as {
      success: boolean;
      products: Product[];
      pagination: { pages: number };
    };
    if (!data.success) break;

    products.push(...data.products);
    pages = data.pagination.pages || 1;
    page += 1;
  } while (page <= pages);

  return products;
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const products = await fetchAllProducts();
    for (const product of products) {
      if (!product.slug || !product.topLevelCategory) continue;
      const categoryPath = product.topLevelCategory === 'CAKES_AND_BAKES' ? 'cakes-and-bakes' : 'fashion';
      entries.push({
        url: `${BASE_URL}/${categoryPath}/${product.slug}`,
        lastModified: product.createdAt ? new Date(product.createdAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch {
    // Product URLs are optional; keep static entries on failure.
  }

  return entries;
}
