'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Shirt, Cake, ArrowRight, ChevronRight } from 'lucide-react';

export default function AdminAddProductPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<'FASHION' | 'CAKES_AND_BAKES' | null>(null);

  const handleContinue = () => {
    if (selected === 'FASHION') router.push('/admin/products/new/fashion');
    if (selected === 'CAKES_AND_BAKES') router.push('/admin/products/new/cakes-and-bakes');
  };

  return (
    <>
      <Header />
      <main className="min-h-[70vh] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-xs font-bold text-neutral-400">
          <Link href="/admin" className="hover:text-dark">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/admin/products" className="hover:text-dark">Products</Link>
          <ChevronRight size={12} />
          <span className="text-dark">Add Product</span>
        </div>

        <div className="text-center mb-10">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-neutral-400 mb-2">Step 1 of 1</p>
          <h1 className="text-3xl font-black tracking-tight uppercase text-stone-900">Choose Product Type</h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
            Select the category for your new product. The workspace will adapt to the correct fields and workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Fashion Card */}
          <button
            onClick={() => setSelected('FASHION')}
            className={`group relative text-left border-2 transition-all duration-200 p-8 focus:outline-none cursor-pointer ${
              selected === 'FASHION'
                ? 'border-stone-900 bg-stone-900 text-white shadow-2xl scale-[1.02]'
                : 'border-stone-200 bg-white hover:border-stone-400 hover:shadow-lg'
            }`}
          >
            {selected === 'FASHION' && (
              <div className="absolute top-4 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-stone-900 rounded-full" />
              </div>
            )}
            <div className={`w-14 h-14 flex items-center justify-center mb-5 rounded-sm ${selected === 'FASHION' ? 'bg-white/10' : 'bg-stone-100'}`}>
              <Shirt size={28} className={selected === 'FASHION' ? 'text-white' : 'text-stone-900'} />
            </div>
            <div className={`text-[10px] font-extrabold uppercase tracking-[0.2em] mb-2 ${selected === 'FASHION' ? 'text-stone-300' : 'text-stone-400'}`}>
              Category
            </div>
            <h2 className={`text-xl font-black tracking-tight uppercase mb-3 ${selected === 'FASHION' ? 'text-white' : 'text-stone-900'}`}>
              Fashion
            </h2>
            <p className={`text-sm leading-relaxed ${selected === 'FASHION' ? 'text-stone-200' : 'text-neutral-500'}`}>
              Modern clothing, footwear, and fashion accessories. Supports size & color variant matrix, gender, material, fit and full attribute system.
            </p>
            <div className={`mt-5 flex gap-2 flex-wrap`}>
              {['Clothing', 'Footwear', 'Accessories', 'Ethnic'].map(tag => (
                <span key={tag} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  selected === 'FASHION' ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* Cakes & Bakes Card */}
          <button
            onClick={() => setSelected('CAKES_AND_BAKES')}
            className={`group relative text-left border-2 transition-all duration-200 p-8 focus:outline-none cursor-pointer ${
              selected === 'CAKES_AND_BAKES'
                ? 'border-amber-700 bg-amber-800 text-white shadow-2xl scale-[1.02]'
                : 'border-stone-200 bg-white hover:border-amber-400 hover:shadow-lg'
            }`}
          >
            {selected === 'CAKES_AND_BAKES' && (
              <div className="absolute top-4 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-amber-800 rounded-full" />
              </div>
            )}
            <div className={`w-14 h-14 flex items-center justify-center mb-5 rounded-sm ${selected === 'CAKES_AND_BAKES' ? 'bg-white/10' : 'bg-amber-50'}`}>
              <Cake size={28} className={selected === 'CAKES_AND_BAKES' ? 'text-white' : 'text-amber-700'} />
            </div>
            <div className={`text-[10px] font-extrabold uppercase tracking-[0.2em] mb-2 ${selected === 'CAKES_AND_BAKES' ? 'text-amber-200' : 'text-amber-600'}`}>
              Category
            </div>
            <h2 className={`text-xl font-black tracking-tight uppercase mb-3 ${selected === 'CAKES_AND_BAKES' ? 'text-white' : 'text-stone-900'}`}>
              Cakes & Bakes
            </h2>
            <p className={`text-sm leading-relaxed ${selected === 'CAKES_AND_BAKES' ? 'text-amber-100' : 'text-neutral-500'}`}>
              Cakes, bakery products, desserts and customizable celebration products. Supports size/flavour/style systems, custom cake builder, and delivery scheduling.
            </p>
            <div className={`mt-5 flex gap-2 flex-wrap`}>
              {['Custom Cakes', 'Bakery', 'Desserts', 'Combos'].map(tag => (
                <span key={tag} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  selected === 'CAKES_AND_BAKES' ? 'bg-white/10 text-white' : 'bg-amber-50 text-amber-700'
                }`}>
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`flex items-center gap-2 px-8 py-3.5 font-extrabold text-sm uppercase tracking-widest transition-all duration-200 ${
              selected
                ? 'bg-stone-900 text-white hover:bg-stone-800 cursor-pointer shadow-lg'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            Continue to Product Studio
            <ArrowRight size={16} />
          </button>
        </div>

        {selected && (
          <p className="text-center text-xs text-neutral-400 mt-4">
            You selected: <strong className="text-stone-700">{selected === 'FASHION' ? 'Fashion' : 'Cakes & Bakes'}</strong>
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
