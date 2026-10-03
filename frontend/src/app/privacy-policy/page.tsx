import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | FastVelix',
  description: 'Learn how FastVelix collects, protects and uses your personal information and transaction details.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">Privacy Policy</h1>
              <p className="text-xs text-neutral-400">Last updated: October 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">1. Information We Collect</h2>
              <p>
                We collect personal information such as your name, email address, phone number, shipping coordinates, and order preferences when you create an account or place an order on FastVelix.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">2. How We Use Your Data</h2>
              <p>
                Your data is used strictly for order fulfillment, dispatch tracking, customer service notifications, fraud prevention, and personalized promotional recommendations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">3. Payment & Financial Security</h2>
              <p>
                FastVelix does not store your raw credit/debit card numbers or UPI PINs. All financial transactions are processed securely through RBI-compliant, PCI-DSS certified payment gateways (Razorpay, Cashfree, PhonePe).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">4. Cookies & Analytics</h2>
              <p>
                We use functional cookies to remember your shopping cart items, category preferences, and secure login session tokens.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">5. Contact Grievance Officer</h2>
              <p>
                If you have questions or concerns about data privacy, please email us at{' '}
                <a href="mailto:privacy@fastvelix.com" className="text-emerald-700 font-semibold hover:underline">
                  privacy@fastvelix.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
