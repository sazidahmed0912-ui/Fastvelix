'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import {
  Tag,
  Copy,
  Check,
  Percent,
  Sparkles,
  Gift,
  Truck,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface CouponItem {
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT' | 'CASHBACK' | 'FREE_SHIPPING';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  description?: string;
  terms?: string;
  expiresAt?: string;
}

const defaultOffers: CouponItem[] = [
  {
    code: 'FIRSTVELIX',
    discountType: 'FLAT',
    discountValue: 100,
    minOrderValue: 499,
    description: 'Get flat ₹100 OFF on your first purchase above ₹499.',
    terms: 'Valid once per new user across all categories.',
  },
  {
    code: 'SWEETCAKE',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderValue: 699,
    maxDiscount: 200,
    description: '15% instant discount on artisanal cakes and pastries.',
    terms: 'Applicable only to the Cakes & Bakes collection.',
  },
  {
    code: 'FASHION50',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderValue: 999,
    maxDiscount: 500,
    description: 'Extra 20% OFF on premium apparel and accessories.',
    terms: 'Applicable on fashion orders above ₹999.',
  },
  {
    code: 'FREESHIP',
    discountType: 'FREE_SHIPPING',
    discountValue: 0,
    minOrderValue: 299,
    description: 'Zero shipping fee on all orders above ₹299.',
    terms: 'Enjoy doorstep delivery with 0 delivery charges.',
  },
];

export default function OffersPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>(defaultOffers);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await api.get<{ success: boolean; coupons: CouponItem[] }>('/coupons/public');
        if (res.success && res.coupons && res.coupons.length > 0) {
          // Merge API coupons with default offers without duplicate codes
          const apiCodes = new Set(res.coupons.map((c) => c.code.toUpperCase()));
          const combined = [
            ...res.coupons,
            ...defaultOffers.filter((o) => !apiCodes.has(o.code.toUpperCase())),
          ];
          setCoupons(combined);
        }
      } catch (err) {
        // Fallback to static offers if backend has none yet
      }
    }
    loadCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getDiscountBadge = (c: CouponItem) => {
    switch (c.discountType) {
      case 'PERCENTAGE':
        return `${c.discountValue}% OFF`;
      case 'FLAT':
        return `₹${c.discountValue} FLAT OFF`;
      case 'FREE_SHIPPING':
        return 'FREE SHIPPING';
      case 'CASHBACK':
        return `₹${c.discountValue} CASHBACK`;
      default:
        return 'SPECIAL OFFER';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-emerald-950 text-white p-8 sm:p-10 shadow-xl mb-10">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide">
              <Sparkles size={14} /> FastVelix Exclusive Promo Codes
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Deals, Coupons & Sweet Savings
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              Apply these verified coupon codes at checkout to unlock instant discounts and free delivery.
            </p>
          </div>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {getDiscountBadge(coupon)}
                  </span>
                  {coupon.minOrderValue && (
                    <span className="text-[11px] text-neutral-400 font-semibold">
                      Min Order: ₹{coupon.minOrderValue}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-neutral-900 mt-2">
                  {coupon.description || `Save with code ${coupon.code}`}
                </h3>
                {coupon.terms && (
                  <p className="text-xs text-neutral-500 mt-1">{coupon.terms}</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                <div className="px-3.5 py-1.5 rounded-lg bg-neutral-100 border border-dashed border-neutral-300 font-mono text-xs font-extrabold tracking-wider text-neutral-900">
                  {coupon.code}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(coupon.code)}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                >
                  {copiedCode === coupon.code ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedCode === coupon.code ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
