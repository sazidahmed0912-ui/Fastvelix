'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CreditCard,
  RefreshCw,
  ChefHat,
  MessageCircle,
  Mail,
  Phone,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const faqs: FaqItem[] = [
  {
    category: 'Orders & Delivery',
    q: 'How fast will my cake or fashion order be delivered?',
    a: 'We offer dedicated same-day and scheduled time-slot deliveries for artisanal cakes. Fashion apparel is dispatched through express logistics within 24–48 hours.',
  },
  {
    category: 'Orders & Delivery',
    q: 'Can I choose an exact delivery time-slot for celebrations?',
    a: 'Yes! During checkout on Cakes & Bakes, you can pick morning, afternoon, evening, or midnight delivery slots to ensure surprise parties are right on time.',
  },
  {
    category: 'Custom Cakes',
    q: 'How do I customize a photo cake or request custom messages?',
    a: 'Use our interactive "Design Your Custom Cake" builder to choose flavors, eggless options, weight (0.5kg to 5kg), custom text piping, and upload photo icing images.',
  },
  {
    category: 'Payments & Wallet',
    q: 'What payment methods are supported on FastVelix?',
    a: 'We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking via Razorpay/Cashfree, FastVelix Store Wallet, and Cash on Delivery (COD).',
  },
  {
    category: 'Payments & Wallet',
    q: 'How does FastVelix Wallet work?',
    a: 'FastVelix Wallet allows instant 1-click checkout, stores your referral rewards and promotional cashbacks, and processes instant cancellation refunds in under 5 seconds.',
  },
  {
    category: 'Returns & Refunds',
    q: 'What is the return policy for fashion products?',
    a: 'Fashion items (apparel, shoes, accessories) have a 7-day hassle-free return and exchange window as long as tags are intact and items are unworn.',
  },
  {
    category: 'Returns & Refunds',
    q: 'Can fresh perishable cakes be returned?',
    a: 'Perishable bakery items cannot be returned after delivery. However, if there is transit damage or a quality issue, we offer instant replacement or full wallet refund within 2 hours of report.',
  },
];

const categories = ['All', 'Orders & Delivery', 'Custom Cakes', 'Payments & Wallet', 'Returns & Refunds'];

export default function HelpCenterPage() {
  const [selectedCat, setSelectedCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [contactSent, setContactSent] = useState(false);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = selectedCat === 'All' || faq.category === selectedCat;
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <HelpCircle size={14} /> 24/7 Customer Support & Help Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
            How Can We Assist You Today?
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            Find answers to commonly asked questions regarding deliveries, custom cakes, payments, and returns.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search size={16} className="absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search topics (e.g., delivery slot, custom cake, refund)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-emerald-600 shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCat === cat
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-12">
          <div className="divide-y divide-neutral-100">
            {filteredFaqs.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400">No matching questions found.</p>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={idx} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between text-left gap-4 font-bold text-xs sm:text-sm text-neutral-900 hover:text-emerald-700 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <span className="p-1 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-xs text-neutral-500 leading-relaxed pl-1 pr-6 animate-fade-in">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Phone size={22} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Phone Support</h3>
            <p className="text-xs text-neutral-500">Mon - Sun from 9 AM to 10 PM</p>
            <p className="text-xs font-extrabold text-neutral-900">+91 99999 88888</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Mail size={22} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Email Helpdesk</h3>
            <p className="text-xs text-neutral-500">Response within 2 hours</p>
            <p className="text-xs font-extrabold text-neutral-900">support@fastvelix.com</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <MessageCircle size={22} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Live Support Chat</h3>
            <p className="text-xs text-neutral-500">Instant AI & Agent Help</p>
            <p className="text-xs font-extrabold text-purple-700">Available on site</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
