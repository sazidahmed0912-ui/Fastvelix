'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Settings, Truck, Check, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fulfillment form states
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('FastVelix Delivery');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSellerOrders();
  }, []);

  async function loadSellerOrders() {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; orders: any[] }>('/seller/orders');
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to load merchant orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusTransition = async (orderId: string, currentStatus: string, targetStatus: string) => {
    setActiveOrderId(orderId);
    
    // Default checks
    if (targetStatus === 'SHIPPED' && !trackingNumber) {
      alert('Please specify a tracking reference ID.');
      setActiveOrderId(null);
      return;
    }

    setUpdating(true);
    try {
      const data = await api.put<{ success: boolean }>(`/orders/${orderId}/status`, {
        status: targetStatus,
        trackingNumber: targetStatus === 'SHIPPED' ? trackingNumber : undefined,
        shippingCarrier: targetStatus === 'SHIPPED' ? shippingCarrier : undefined,
      });

      if (data.success) {
        alert(`Order transitioned to ${targetStatus}!`);
        setTrackingNumber('');
        loadSellerOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Status transition error.');
    } finally {
      setUpdating(false);
      setActiveOrderId(null);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <div className="mb-6">
          <Link href="/seller" className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-dark">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-neutral-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Merchant Fulfillments</h1>
            <p className="text-sm text-neutral-500 mt-1">Fulfill incoming orders and dispatch parcels.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Navbar */}
          <aside className="border-r border-neutral-100 pr-0 lg:pr-6 space-y-1">
            <Link href="/seller" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link href="/seller/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingBag size={16} /> My Products
            </Link>
            <Link href="/seller/orders" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
              <ShoppingCart size={16} /> Order Fulfillments
            </Link>
            <Link href="/seller/profile" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Settings size={16} /> Store Profile
            </Link>
          </aside>

          {/* Orders list details */}
          <div className="lg:col-span-3">
            {loading ? (
              <p className="text-sm text-neutral-400 animate-pulse">Loading order details...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center bg-white border">No orders matched.</p>
            ) : (
              <div className="space-y-6">
                {orders.map((o) => (
                  <div key={o._id} className="border border-neutral-200 bg-white p-6 shadow-sm-custom space-y-4">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-100 text-xs">
                      <div>
                        <span className="font-extrabold text-sm block">#{o.orderNumber}</span>
                        <span className="text-neutral-400">Date: {new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <span className={clsx(
                        "font-extrabold uppercase px-2 py-0.5 text-white tracking-widest text-[9px]",
                        o.status === 'DELIVERED' && "bg-brand",
                        o.status === 'CANCELLED' && "bg-red-500",
                        !['DELIVERED', 'CANCELLED'].includes(o.status) && "bg-dark"
                      )}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Items inside this order that belong to this seller */}
                    <div className="divide-y divide-neutral-100">
                      {o.items.map((item: any, idx: number) => (
                        <div key={idx} className="py-2.5 flex justify-between gap-4 text-xs font-medium">
                          <div>
                            <span className="font-bold text-dark text-sm block">{item.title}</span>
                            <span className="text-neutral-400">SKU: {item.sku} | Qty: {item.quantity} | {item.size || item.packSize}</span>
                          </div>
                          <span className="font-bold text-dark">₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status actions selector */}
                    {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status) && (
                      <div className="border-t border-neutral-100 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-50/50 p-4">
                        
                        {o.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusTransition(o._id, o.status, 'CONFIRMED')}
                            disabled={updating && activeOrderId === o._id}
                            className="h-10 px-6 bg-brand text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            Accept & Confirm Order
                          </button>
                        )}

                        {o.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleStatusTransition(o._id, o.status, 'PROCESSING')}
                            disabled={updating && activeOrderId === o._id}
                            className="h-10 px-6 bg-dark text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Mark: Processing / Packing
                          </button>
                        )}

                        {o.status === 'PROCESSING' && (
                          <div className="flex flex-col md:flex-row gap-3 w-full">
                            <input
                              type="text"
                              required
                              placeholder="Tracking ID (e.g. FVT12345)"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              className="h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-xs flex-grow bg-white"
                            />
                            <input
                              type="text"
                              required
                              placeholder="Carrier Service"
                              value={shippingCarrier}
                              onChange={(e) => setShippingCarrier(e.target.value)}
                              className="h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-xs bg-white w-full md:w-48"
                            />
                            <button
                              onClick={() => handleStatusTransition(o._id, o.status, 'SHIPPED')}
                              disabled={updating && activeOrderId === o._id}
                              className="h-10 px-6 bg-brand text-white text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
                            >
                              Dispatch & Ship Parcel
                            </button>
                          </div>
                        )}

                        {o.status === 'SHIPPED' && (
                          <button
                            onClick={() => handleStatusTransition(o._id, o.status, 'OUT_FOR_DELIVERY')}
                            disabled={updating && activeOrderId === o._id}
                            className="h-10 px-6 bg-dark text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Set: Out for Delivery
                          </button>
                        )}

                        {o.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleStatusTransition(o._id, o.status, 'DELIVERED')}
                            disabled={updating && activeOrderId === o._id}
                            className="h-10 px-6 bg-brand text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Confirm Package Delivered
                          </button>
                        )}

                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
