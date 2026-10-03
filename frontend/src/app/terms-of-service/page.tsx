import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileText } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | FastVelix',
  description: 'User agreement, purchasing terms, and platform conditions for FastVelix.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">Terms of Service</h1>
              <p className="text-xs text-neutral-400">Effective Date: October 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">1. Acceptance of Terms</h2>
              <p>
                By accessing or placing an order on FastVelix, you agree to be bound by these Terms of Service, all applicable laws, and regulations in India.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">2. Custom Cake Orders & Freshness Guarantee</h2>
              <p>
                Because artisanal cakes and pastries are perishable foodstuffs prepared specifically upon order, custom cake instructions (flavor, weight, message, eggless selection) become final once baking commences.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">3. Fashion Products & Return Window</h2>
              <p>
                Fashion items may be returned within 7 calendar days from delivery provided they remain unworn, unwashed, and in their original packaging with tags attached.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">4. FastVelix Wallet & Promotional Credits</h2>
              <p>
                Wallet promotional cashbacks and referral coins are non-transferable outside FastVelix and cannot be redeemed for physical cash currency.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">5. Governing Law & Dispute Resolution</h2>
              <p>
                These terms are governed by the laws of India. Any legal disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
