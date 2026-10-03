import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, ShieldCheck, Heart, Truck, Award, Users } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | FastVelix India',
  description: 'Learn about FastVelix - India\'s premier platform for bespoke cakes, pastries and trending fashion.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <Sparkles size={14} /> The FastVelix Story
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
            Crafting Sweet Moments & Modern Fashion
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-3 leading-relaxed">
            FastVelix is India's dedicated multi-category platform bridging artisanal handcrafted cakes and bakes with curated contemporary fashion apparel.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award size={24} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Master Craftsmanship</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Every celebration cake is baked fresh on the day of delivery by certified pastry chefs using premium chocolate, Belgian ganache, and natural pure fruit fillings.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck size={24} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Guaranteed Time-Slots</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Equipped with temperature-controlled logistics, we guarantee that surprises, birthday parties, and anniversaries receive flawless doorstep delivery.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Heart size={24} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Curated Fashion Trends</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Our fashion segment delivers the latest seasonal collections, designer streetwear, festive ethnic wear, and daily essentials straight from top brands.
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-3">Our Mission</h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            To provide an unparalleled, joyful shopping experience where premium quality, punctuality, and customer delight come first. Whether you're celebrating a milestone with a 3-tier custom cake or refreshing your wardrobe with modern silhouettes, FastVelix delivers excellence to your doorstep.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
