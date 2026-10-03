'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategorySwitch from '@/components/CategorySwitch';
import ProductGrid from '@/components/ProductGrid';
import FilterSidebar from '@/components/FilterSidebar';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';

function FashionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setCategory } = useStore();

  const subcat = searchParams.get('subcategory') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // List of Fashion Subcategories
  const fashionSubcats = [
    { name: 'All', slug: '', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300' },
    { name: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300' },
    { name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300' },
    { name: 'Kids', slug: 'kids', image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=300' },
    { name: 'Footwear', slug: 'footwear', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300' },
    { name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300' }
  ];

  useEffect(() => {
    setCategory('FASHION');
  }, [setCategory]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(searchParams.toString());
        queryParams.set('topLevelCategory', 'FASHION');
        queryParams.set('sort', sortBy);
        if (subcat) {
          queryParams.set('subcategory', subcat);
        }

        const data = await api.get<{ success: boolean; products: any[] }>(
          `/products?${queryParams.toString()}`
        );
        if (data.success) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to load fashion catalogue:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [searchParams, subcat, sortBy]);

  const handleSubcatClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('subcategory', slug);
    else params.delete('subcategory');
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <CategorySwitch />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Compact Editorial Banner */}
        <div className="relative w-full h-[140px] sm:h-[180px] md:h-[220px] rounded bg-stone-950 flex items-center mb-4 shadow-sm overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200"
            alt="Fashion Catalogue"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent" />
          <div className="relative z-10 px-6 sm:px-8 text-white space-y-1">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-800/50">
              Fashion Studio
            </span>
            <h1 className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight text-white">
              Fashion Catalogue
            </h1>
            <p className="text-xs text-neutral-300 max-w-sm">
              Discover curated apparel, shoes and accessories.
            </p>
          </div>
        </div>

        {/* Breadcrumb & Sort Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <Link href="/" className="hover:text-black">Home</Link>
            <ChevronRight size={10} />
            <span className="text-stone-900">Fashion</span>
            {subcat && (
              <>
                <ChevronRight size={10} />
                <span className="text-emerald-800 font-extrabold">{subcat}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden h-8 px-3 border border-neutral-200 text-stone-900 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 bg-white hover:bg-neutral-50"
            >
              <SlidersHorizontal size={12} /> Filter
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 border border-neutral-200 text-[11px] font-semibold px-2 bg-white text-stone-900 focus:outline-none"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Small Square Category Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-5">
          {fashionSubcats.map((item) => (
            <button
              key={item.slug}
              onClick={() => handleSubcatClick(item.slug)}
              className={clsx(
                "group flex flex-col items-center gap-1.5 p-1.5 sm:p-2 rounded-lg border transition-all duration-200 shadow-xs cursor-pointer text-left w-full",
                subcat === item.slug
                  ? "bg-stone-900 border-stone-900 text-white"
                  : "bg-stone-50 hover:bg-stone-100/90 border-stone-200/70 hover:border-stone-400/80 text-stone-800"
              )}
            >
              <div className="relative w-full aspect-square rounded-md overflow-hidden bg-stone-200 shadow-xs border border-stone-200/60">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span
                className={clsx(
                  "text-[11px] sm:text-xs font-bold uppercase tracking-wider text-center truncate w-full px-0.5",
                  subcat === item.slug ? "text-white" : "text-stone-800 group-hover:text-black"
                )}
              >
                {item.name}
              </span>
            </button>
          ))}
        </div>

        {/* Content Layout */}
        <div className="flex gap-6 items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-60 shrink-0 sticky top-28">
            <FilterSidebar type="FASHION" category="FASHION" />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            <ProductGrid products={products} isLoading={loading} emptyMessage="No fashion products found." />
          </div>
        </div>

        {/* Mobile Filters Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-end lg:hidden">
            <div className="w-4/5 max-w-xs bg-white h-full overflow-y-auto p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 mb-4 border-b">
                  <h3 className="font-bold text-xs uppercase tracking-wider">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-neutral-100 rounded">
                    <X size={16} />
                  </button>
                </div>
                <FilterSidebar type="FASHION" category="FASHION" onClose={() => setShowMobileFilters(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function FashionPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-neutral-400">Loading catalogue...</div>}>
        <FashionContent />
      </Suspense>
      <Footer />
    </>
  );
}
