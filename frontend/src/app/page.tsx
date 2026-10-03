'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategorySwitch from '@/components/CategorySwitch';
import ShopByCategory, { ShopCategory } from '@/components/ShopByCategory';
import ProductGrid from '@/components/ProductGrid';
import { useStore } from '@/store/useStore';
import { api } from '@/utils/api';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { category } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFashion = category === 'FASHION';

  // Category shortcuts — rendered as circular icons by ShopByCategory
  const fashionCategories: ShopCategory[] = [
    { name: 'Men', href: '/fashion?subcategory=men', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&h=200&fit=crop&q=60' },
    { name: 'Women', href: '/fashion?subcategory=women', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&q=60' },
    { name: 'Kids', href: '/fashion?subcategory=kids', image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=200&h=200&fit=crop&q=60' },
    { name: 'Footwear', href: '/fashion?subcategory=footwear', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop&q=60' },
    { name: 'Accessories', href: '/fashion?subcategory=accessories', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=200&h=200&fit=crop&q=60' },
    { name: 'New Arrivals', href: '/fashion?subcategory=new-arrivals', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=200&fit=crop&q=60' },
  ];

  const bakeryCategories: ShopCategory[] = [
    { name: 'Birthday Cakes', href: '/cakes-and-bakes/cakes', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop&q=60' },
    { name: 'Designer Cakes', href: '/cakes-and-bakes/designer-cakes', image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=200&h=200&fit=crop&q=60' },
    { name: 'Photo Cakes', href: '/cakes-and-bakes/photo-cakes', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200&h=200&fit=crop&q=60' },
    { name: 'Cupcakes', href: '/cakes-and-bakes/cupcakes', image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=200&h=200&fit=crop&q=60' },
    { name: 'Pastries & Breads', href: '/cakes-and-bakes/pastries', image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=200&h=200&fit=crop&q=60' },
    { name: 'Cookies & Desserts', href: '/cakes-and-bakes/cookies-desserts', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&h=200&fit=crop&q=60' },
  ];

  useEffect(() => {
    async function loadHomeProducts() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; products: any[] }>(
          `/products?topLevelCategory=${category}&limit=12`
        );
        if (data.success) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to load homepage products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeProducts();
  }, [category]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        
        {/* Category Switch Control */}
        <CategorySwitch />

        {/* ─── 1. COMPACT HERO BANNER ─── */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
          {isFashion ? (
            /* FASHION BANNER — Editorial B/W & Minimal */
            <div className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] lg:h-[320px] rounded-lg overflow-hidden bg-stone-950 flex items-center shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400"
                alt="Fashion Banner"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/70 to-transparent" />
              
              <div className="relative z-10 px-6 sm:px-10 lg:px-12 text-white max-w-xl space-y-2 sm:space-y-3">
                <span className="inline-flex items-center gap-1 bg-emerald-800 text-white text-[9px] sm:text-[10px] font-extrabold px-2.5 py-0.5 uppercase tracking-widest rounded-none">
                  Editorial Collection
                </span>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight text-white">
                  Elevate Your Everyday
                </h1>
                <p className="text-xs sm:text-sm text-neutral-300 font-medium line-clamp-2">
                  Discover modern fashion made for your style.
                </p>
                <div className="pt-1">
                  <Link
                    href="/fashion"
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-100 text-stone-950 font-extrabold text-[10px] sm:text-xs uppercase tracking-widest px-4 sm:px-6 py-2 transition-colors rounded-none"
                  >
                    <span>Shop Fashion</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* CAKES & BAKES BANNER — Studio Bakery & Warm Atmosphere */
            <div className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] lg:h-[320px] rounded-xl overflow-hidden bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 flex items-center shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400"
                alt="Cakes & Bakes Banner"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-950/90 via-stone-900/80 to-transparent" />
              
              <div className="relative z-10 px-6 sm:px-10 lg:px-12 text-white max-w-xl space-y-2 sm:space-y-3">
                <span className="inline-flex items-center gap-1 bg-amber-400 text-stone-950 text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-widest rounded-full">
                  <Sparkles size={11} /> Artisanal Cake Studio
                </span>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
                  Made for Moments <br className="hidden sm:inline" />
                  <span className="text-amber-200 italic font-normal">Worth Celebrating</span>
                </h1>
                <p className="text-xs sm:text-sm text-stone-200 font-medium line-clamp-2">
                  Custom cakes, fresh bakes and beautiful treats for every occasion.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <Link
                    href="/cakes-and-bakes/cakes"
                    className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest px-4 sm:px-6 py-2 transition-colors rounded-full shadow-sm"
                  >
                    <span>Explore Cakes & Bakes</span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link
                    href="/cakes-and-bakes/custom-cake"
                    className="inline-flex items-center gap-1 text-amber-200 hover:text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider underline"
                  >
                    Custom Cake Studio
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ─── 2. SHOP BY CATEGORY (circle icons, copied from Fzokart) ─── */}
        <ShopByCategory
          categories={isFashion ? fashionCategories : bakeryCategories}
          title="Shop by Categories"
        />

        {/* ─── 3. CUSTOM CAKE SPOTLIGHT (CAKES & BAKES ONLY) ─── */}
        {!isFashion && (
          <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
            <div className="bg-emerald-950 text-white rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-emerald-900">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="hidden sm:block w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-emerald-700/50">
                  <img src="https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=200" alt="Custom Cake Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">Customization Studio</span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white">Design Your Own Cake</h3>
                  <p className="text-xs text-emerald-200 mt-0.5 max-w-md">Pick shape, size, premium flavours, custom message &amp; photo toppers with instant live pricing.</p>
                </div>
              </div>
              <Link
                href="/cakes-and-bakes/custom-cake"
                className="shrink-0 h-9 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 transition-colors"
              >
                <Sparkles size={13} />
                <span>Start Designing</span>
              </Link>
            </div>
          </section>
        )}

        {/* ─── 4. PRODUCT GRID SECTION ─── */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">
                {isFashion ? 'TRENDING FASHION' : 'FRESHLY BAKED PICKS'}
              </h2>
              <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                {isFashion ? 'Popular Style Selections' : 'Handcrafted Bakery Bestsellers'}
              </h3>
            </div>
            <Link
              href={isFashion ? '/fashion' : '/cakes-and-bakes/cakes'}
              className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <ProductGrid products={products} isLoading={loading} />
        </section>

      </main>
      <Footer />
    </>
  );
}
