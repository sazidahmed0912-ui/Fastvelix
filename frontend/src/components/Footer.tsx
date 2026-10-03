'use client';

import React from 'react';
import Link from 'next/link';

/**
 * ⚠️ The trust-badges bar, the brand summary column and the four
 * category / support / company link columns were removed by request.
 * Only the legal bar below remains.
 *
 * Must stay a client component — it is imported by `'use client'` pages.
 */
export default function Footer() {
  return (
    <footer className="bg-neutral-50 text-dark border-t border-neutral-200 mt-auto pb-16 lg:pb-0">
      {/* Copyright Bar */}
      <div className="py-6 bg-white text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} FastVelix Retail India Private Limited. All rights reserved.</span>
          <div className="flex flex-wrap gap-4 text-neutral-500">
            <Link href="/terms" className="hover:text-dark">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-dark">Privacy Policy</Link>
            <Link href="/shipping-policy" className="hover:text-dark">Shipping Policy</Link>
            <Link href="/returns-refunds-policy" className="hover:text-dark">Refund Policy</Link>
            <Link href="/become-seller" className="hover:text-brand font-semibold text-emerald-800">Become a Seller</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
