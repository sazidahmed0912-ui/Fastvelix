'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import {
  Package,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Calendar,
  ChefHat,
  Sparkles,
} from 'lucide-react';

interface TrackingOrder {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  deliverySlot?: {
    date: string;
    slot: string;
  };
  deliveryAddress: {
    fullName: string;
    city: string;
    state: string;
    pinCode: string;
  };
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    thumbnail?: string;
  }>;
  total: number;
  deliveryAgent?: {
    name?: string;
    phone?: string;
    vehicle?: string;
  };
  deliveryText?: string;
}

const statusSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock, desc: 'We received your order' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2, desc: 'Order verified by seller' },
  { key: 'PROCESSING', label: 'Baking / Preparing', icon: ChefHat, desc: 'Master chefs preparing items' },
  { key: 'SHIPPED', label: 'Out for Delivery', icon: Truck, desc: 'Rider is on the way' },
  { key: 'DELIVERED', label: 'Delivered', icon: Package, desc: 'Handed over successfully' },
];

export default function TrackOrderPage() {
  const [orderQuery, setOrderQuery] = useState('');
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const cleanId = orderQuery.trim().replace(/^#/, '');
      const res = await api.get<{ success: boolean; order: TrackingOrder }>(`/orders/${cleanId}`);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError('No order found with the provided Order ID. Please double-check.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to track order. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    const map: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 1,
      PROCESSING: 2,
      SHIPPED: 3,
      DELIVERED: 4,
      CANCELLED: -1,
    };
    return map[status] ?? 0;
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Search Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <Truck size={14} /> Live Dispatch Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
            Track Your Order in Real-Time
          </h1>
          <p className="text-xs text-neutral-500 mt-2">
            Enter your 24-character Order ID or confirmation number from your SMS / email receipt.
          </p>

          <form onSubmit={handleTrack} className="mt-6 flex items-center gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                required
                placeholder="e.g. 660f9a2b84f..."
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-600 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Tracking Details */}
        {order && (
          <div className="space-y-6 animate-fade-in">
            {/* Order Status Banner */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Order Ref</span>
                  <h2 className="text-lg font-extrabold text-neutral-900 mt-0.5">#{order.orderNumber || order._id}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700">
                    Paid: ₹{order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Delivery Agent Card */}
              {order.deliveryAgent && (order.deliveryAgent.name || order.deliveryText) && (
                <div className="mt-6 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0">
                    <Truck size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Assigned Delivery Partner
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-emerald-900 font-semibold">
                      {order.deliveryAgent.name && <span>Agent: {order.deliveryAgent.name}</span>}
                      {order.deliveryAgent.phone && (
                        <a href={`tel:${order.deliveryAgent.phone}`} className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                          <Phone size={12} /> {order.deliveryAgent.phone}
                        </a>
                      )}
                      {order.deliveryAgent.vehicle && <span>Vehicle: {order.deliveryAgent.vehicle}</span>}
                    </div>
                    {order.deliveryText && (
                      <p className="mt-1.5 text-[11px] text-emerald-800 bg-white/60 p-2 rounded-md border border-emerald-200/50">
                        {order.deliveryText}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Stepper */}
              <div className="mt-8 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                  {statusSteps.map((step, idx) => {
                    const isPassed = currentStep >= idx;
                    const isCurrent = currentStep === idx;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                            isPassed
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                              : 'bg-white border-neutral-300 text-neutral-400'
                          } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                        >
                          <StepIcon size={18} />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isPassed ? 'text-neutral-900' : 'text-neutral-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 hidden sm:block">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">
                Items in this Consignment
              </h3>
              <div className="divide-y divide-neutral-100">
                {order.items.map((item, i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <Package size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900">{item.title}</p>
                        <p className="text-[11px] text-neutral-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-xs font-extrabold text-neutral-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
