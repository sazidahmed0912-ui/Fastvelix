'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategorySwitch from '@/components/CategorySwitch';
import ProductGrid from '@/components/ProductGrid';
import ShopByCategory, { ShopCategory } from '@/components/ShopByCategory';
import { api } from '@/utils/api';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function CakesAndBakesLandingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Identical list, images and ordering to the homepage, so the two pages
  // cannot drift apart again.
  const bakeryCategories: ShopCategory[] = [
    { name: 'Birthday Cakes', href: '/cakes-and-bakes/cakes', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop&q=60' },
    { name: 'Designer Cakes', href: '/cakes-and-bakes/designer-cakes', image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=200&h=200&fit=crop&q=60' },
    { name: 'Photo Cakes', href: '/cakes-and-bakes/photo-cakes', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200&h=200&fit=crop&q=60' },
    { name: 'Cupcakes', href: '/cakes-and-bakes/cupcakes', image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=200&h=200&fit=crop&q=60' },
    { name: 'Pastries & Breads', href: '/cakes-and-bakes/pastries', image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=200&h=200&fit=crop&q=60' },
    { name: 'Cookies & Desserts', href: '/cakes-and-bakes/cookies-desserts', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&h=200&fit=crop&q=60' },
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

      {/* ─── 1. HERO BANNER — image only ─── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] lg:h-[320px] rounded-xl overflow-hidden bg-amber-950 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400"
            alt="Cakes & Bakes Banner"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>
      </section>

      {/* ─── 2. BAKERY COLLECTIONS ─── */}
      <ShopByCategory categories={bakeryCategories} title="Bakery Collection" />

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

