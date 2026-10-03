import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Refunds Policy | FastVelix',
  description: 'FastVelix returns, cancellation, and instant refund guidelines.',
};

export default function ReturnsRefundsPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <RefreshCw size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">Returns & Refunds Policy</h1>
              <p className="text-xs text-neutral-400">Hassle-free resolutions & instant refunds</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">1. Fashion Category Returns (7 Days)</h2>
              <p>
                All fashion apparel, shoes, and accessories are eligible for return or exchange within 7 days of delivery. Items must be unused with tags and original packaging intact.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">2. Bakery & Perishable Cakes Policy</h2>
              <p>
                Due to food safety hygiene standards, freshly baked cakes cannot be physically returned once accepted. If you receive a damaged or incorrect cake, submit a photo to our live chat or email within 2 hours of delivery for a replacement or full refund.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">3. Instant Wallet Refunds</h2>
              <p>
                Refunds processed to your <strong>FastVelix Wallet</strong> are credited instantaneously (within seconds) and are immediately usable for future orders. Original payment mode refunds (Bank/UPI/Card) take 3–5 banking days.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
