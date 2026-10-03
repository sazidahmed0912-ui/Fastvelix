'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategorySwitch from '@/components/CategorySwitch';
import ProductGrid from '@/components/ProductGrid';
import FilterSidebar from '@/components/FilterSidebar';
import { api } from '@/utils/api';
import { useStore, TopLevelCategory } from '@/store/useStore';
import { SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';

function SearchContent() {
  const searchParams = useSearchParams();
  const { category, setCategory } = useStore();

  const q = searchParams.get('q') || '';
  const catParam = searchParams.get('category') || '';
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    // If category param is set in URL, sync it with state store
    if (catParam) {
      const formatted = catParam.toUpperCase() as TopLevelCategory;
      if (formatted === 'FASHION' || formatted === 'CAKES_AND_BAKES') {
        setCategory(formatted);
      }
    }
  }, [catParam, setCategory]);

  useEffect(() => {
    async function performSearch() {
      if (!q) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(searchParams.toString());
        queryParams.set('q', q);
        queryParams.set('topLevelCategory', category);
        queryParams.set('sort', sortBy);

        const data = await api.get<{ success: boolean; products: any[] }>(
          `/products/search?${queryParams.toString()}`
        );
        if (data.success) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Search request failed:', err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [q, category, searchParams, sortBy]);

  return (
    <>
      <CategorySwitch />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Breadcrumb & Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
              <span>Home</span>
              <ChevronRight size={10} />
              <span>Search</span>
              <ChevronRight size={10} />
              <span className="text-stone-900 font-extrabold">"{q}"</span>
            </div>
            <h1 className="text-lg font-bold text-stone-900">
              {products.length} results for "{q}"
            </h1>
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
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Layout */}
        <div className="flex gap-6 items-start">
          <div className="hidden lg:block w-60 shrink-0 sticky top-28">
            <FilterSidebar category={category} type={category} />
          </div>

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={products}
              isLoading={loading}
              emptyMessage={`No products found matching "${q}" in ${category === 'FASHION' ? 'Fashion' : 'Cakes & Bakes'}.`}
            />
          </div>
        </div>

        {/* Mobile Filters Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-end lg:hidden">
            <div className="w-4/5 max-w-xs bg-white h-full overflow-y-auto p-4">
              <div className="flex justify-between items-center pb-3 mb-4 border-b">
                <h3 className="font-bold text-xs uppercase tracking-wider">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-neutral-100 rounded">
                  <X size={16} />
                </button>
              </div>
              <FilterSidebar category={category} type={category} onClose={() => setShowMobileFilters(false)} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-neutral-400 animate-pulse">
          Loading search context...
        </div>
      }>
        <SearchContent />
      </Suspense>
      <Footer />
    </>
  );
}
