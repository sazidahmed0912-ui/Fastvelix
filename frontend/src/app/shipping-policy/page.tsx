import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Truck, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | FastVelix',
  description: 'FastVelix time-slot delivery details, shipping charges, and fulfillment terms.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">Shipping & Delivery Policy</h1>
              <p className="text-xs text-neutral-400">Fast doorstep deliveries across India</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">1. Fresh Cakes & Bakes Time-Slots</h2>
              <p>
                We deliver fresh bakery items in customized time slots:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-500">
                <li><strong>Morning Delivery:</strong> 09:00 AM – 12:00 PM</li>
                <li><strong>Afternoon Delivery:</strong> 01:00 PM – 04:00 PM</li>
                <li><strong>Evening Delivery:</strong> 05:00 PM – 08:00 PM</li>
                <li><strong>Midnight Surprise:</strong> 11:15 PM – 12:00 AM</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">2. Fashion Apparel Dispatch</h2>
              <p>
                Fashion items are shipped via express courier partners with end-to-end tracking. Expected transit time is 2 to 4 business days depending on delivery pincode.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">3. Shipping Fees & Free Delivery Threshold</h2>
              <p>
                Orders totaling ₹499 or more qualify for <strong>FREE Delivery</strong>. Standard delivery fee of ₹49 applies for orders below ₹499.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
