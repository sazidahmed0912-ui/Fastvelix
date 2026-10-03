'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategorySwitch from '@/components/CategorySwitch';
import ProductGrid from '@/components/ProductGrid';
import { api } from '@/utils/api';
import { Sparkles, Cake, Gift, Heart, ArrowRight, Award, ShieldCheck, ChevronRight } from 'lucide-react';

export default function CakesAndBakesLandingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const bakeryCategories = [
    { name: 'Birthday Cakes', slug: 'cakes', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300' },
    { name: 'Designer Cakes', slug: 'designer-cakes', image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=300' },
    { name: 'Photo Cakes', slug: 'photo-cakes', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300' },
    { name: 'Wedding Cakes', slug: 'wedding-cakes', image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=300' },
    { name: 'Cupcakes', slug: 'cupcakes', image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=300' },
    { name: 'Pastries & Breads', slug: 'pastries', image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=300' },
    { name: 'Cookies & Desserts', slug: 'cookies-desserts', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300' },
    { name: 'Celebration Gifts', slug: 'gifts', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300' },
  ];

  useEffect(() => {
    async function loadBakes() {
      try {
        const res = await api.get<{ success: boolean; products: any[] }>('/products?topLevelCategory=CAKES_AND_BAKES&limit=12');
        if (res.success) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Error loading bakes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBakes();
  }, []);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">
      <Header />
      <CategorySwitch />

      {/* ─── 1. COMPACT BAKERY HERO ─── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] lg:h-[320px] rounded-xl overflow-hidden bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 flex items-center shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400"
            alt="Cakes & Bakes Hero"
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
      </section>

      {/* ─── 2. BAKERY CATEGORIES ─── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">Bakery Collections</h2>
          <Link href="/cakes-and-bakes/cakes" className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black flex items-center gap-0.5">
            <span>View All</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3">
          {bakeryCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/cakes-and-bakes/${cat.slug}`}
              className="group flex flex-col items-center gap-1.5 p-1.5 sm:p-2 rounded-lg bg-amber-50/40 hover:bg-amber-50/90 border border-amber-900/10 hover:border-amber-700/30 transition-all duration-200 shadow-xs cursor-pointer"
            >
              <div className="relative w-full aspect-square rounded-md overflow-hidden bg-amber-100/50 shadow-xs border border-amber-200/60">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-stone-800 group-hover:text-emerald-800 text-center truncate w-full px-0.5">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 3. CUSTOM CAKE DESIGNER SPOTLIGHT ─── */}
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

      {/* ─── 4. FRESH BAKERY PRODUCTS GRID ─── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">FRESHLY BAKED PICKS</h2>
            <h3 className="text-lg font-bold font-serif text-stone-900 mt-0.5">Handcrafted Bakery Bestsellers</h3>
          </div>
          <Link
            href="/cakes-and-bakes/cakes"
            className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <ProductGrid products={products} isLoading={loading} />
      </section>

      <Footer />
    </div>
  );
}

