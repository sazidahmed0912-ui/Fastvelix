'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Receipt,
} from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('id') || '';

  return (
    <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 text-center">
      {/* Celebration Icon */}
      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-600 flex items-center justify-center mb-6 animate-bounce">
        <CheckCircle2 size={44} />
      </div>

      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
        <Sparkles size={14} /> Order Placed Successfully!
      </div>

      <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
        Thank You for Shopping with FastVelix
      </h1>
      <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-md mx-auto">
        Your order has been received and confirmed. Our master pastry chefs and fashion partners are now preparing your items.
      </p>

      {/* Order Info Card */}
      <div className="mt-8 bg-white border border-neutral-200 rounded-2xl p-6 text-left shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Order Reference</span>
            <p className="font-mono text-sm font-bold text-neutral-900 mt-0.5">
              {orderId ? `#${orderId}` : 'Confirmed (Check email/SMS)'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Payment Verified
          </span>
        </div>

        <div className="flex items-center gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/60">
          <div className="p-2 rounded-lg bg-emerald-600 text-white">
            <Truck size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-900">Estimated Delivery Time-Slot</p>
            <p className="text-[11px] text-neutral-500">Scheduled for today with real-time freshness guarantee</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {orderId ? (
          <Link
            href={`/orders/${orderId}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Package size={16} /> View Order Details
          </Link>
        ) : (
          <Link
            href="/account/orders"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Package size={16} /> My Orders
          </Link>
        )}

        <Link
          href="/track-order"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-800 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Truck size={16} /> Live Dispatch Tracker
        </Link>

        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="py-12 text-xs text-neutral-400">Loading order status...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
