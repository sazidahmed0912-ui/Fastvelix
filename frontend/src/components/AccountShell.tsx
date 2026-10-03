'use client';

/**
 * ══════════════════════════════════════════════════════════════
 * ⚡ FASTVELIX — ACCOUNT SHELL
 * Shared chrome for every /account/* route.
 *
 * Layout structure copied from the Fzokart reference project
 * (frontend-next/app/_pages/ProfilePage.tsx):
 *   • soft grey page background (#F5F7FA)
 *   • 1200px max-width container
 *   • horizontal stack on mobile → row on lg
 *   • 280px sidebar column + flexible content column
 * ══════════════════════════════════════════════════════════════
 */

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AccountSidebar from '@/components/AccountSidebar';

export default function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA] text-[#1F2937]">
      <Header />

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-5 pb-24 lg:pb-8 flex flex-col lg:flex-row gap-3 md:gap-6">
        {/* ──────── ACCOUNT SIDEBAR / NAVIGATION ──────── */}
        <AccountSidebar />

        {/* ──────── MAIN CONTENT ──────── */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
