'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import ThreeDotMenu, { ThreeDotMenuItem } from '@/components/ThreeDotMenu';
import {
  Package,
  Calendar,
  ChevronRight,
  Truck,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface OrderSummary {
  _id: string;
  orderNumber: string;
  items: { title: string; thumbnail: string }[];
  status: string;
  paymentStatus: string;
  grandTotal: number;
  createdAt: string;
}

const CANCELLABLE = ['PENDING', 'CONFIRMED'];

export default function UserOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; orders: OrderSummary[] }>('/orders');
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function runAction(order: OrderSummary, action: 'cancel' | 'return') {
    const verb = action === 'cancel' ? 'cancel' : 'request a return for';
    if (!window.confirm(`Are you sure you want to ${verb} order #${order.orderNumber}?`)) return;

    setBusyId(order._id);
    try {
      await api.post(`/orders/${order._id}/${action}`, {
        reason: action === 'cancel' ? 'Cancelled by customer' : 'Return requested by customer',
      });
      await loadOrders();
    } catch (err: any) {
      setError(err.message || 'Action failed. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  function buildMenuItems(order: OrderSummary): ThreeDotMenuItem[] {
    const items: ThreeDotMenuItem[] = [
      {
        key: 'track',
        label: 'Track Order',
        icon: Truck,
        onSelect: () => router.push(`/orders/${order._id}`),
      },
      {
        key: 'invoice',
        label: 'View Invoice',
        icon: FileText,
        onSelect: () => router.push(`/orders/${order._id}/invoice`),
      },
    ];

    if (CANCELLABLE.includes(order.status)) {
      items.push({
        key: 'cancel',
        label: 'Cancel Order',
        icon: XCircle,
        color: 'text-red-600',
        onSelect: () => runAction(order, 'cancel'),
      });
    }

    if (order.status === 'DELIVERED') {
      items.push({
        key: 'return',
        label: 'Request Return',
        icon: RotateCcw,
        color: 'text-amber-600',
        onSelect: () => runAction(order, 'return'),
      });
    }

    return items;
  }

  return (
      <div className="space-y-1">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider mb-6">
          <span>Home</span>
          <ChevronRight size={12} />
          <span>Account</span>
          <ChevronRight size={12} />
          <span className="text-dark">My Orders</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-8 uppercase">My Orders</h1>

        {error && (
          <p className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-semibold">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-neutral-400 animate-pulse">Loading orders history...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border border-neutral-100 bg-white shadow-sm-custom flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-neutral-50 rounded-full text-neutral-400">
              <Package size={40} />
            </div>
            <h2 className="text-sm font-bold text-neutral-500">You haven't placed an order yet.</h2>
            <Link
              href="/"
              className="mt-2 inline-flex items-center justify-center bg-dark text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 hover:bg-neutral-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord._id}
                className="border border-neutral-200 bg-white p-6 shadow-sm-custom flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-dark transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-extrabold text-sm text-dark">#{ord.orderNumber}</span>
                    <span className="text-neutral-400">|</span>
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(ord.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                    <span className="text-neutral-400">|</span>
                    <span className={clsx(
                      "font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 text-white",
                      ord.status === 'DELIVERED' && "bg-brand",
                      ord.status === 'CANCELLED' && "bg-red-500",
                      !['DELIVERED', 'CANCELLED'].includes(ord.status) && "bg-dark"
                    )}>
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Items snapshot thumbs */}
                  <div className="flex gap-2 items-center overflow-x-auto py-1">
                    {ord.items.map((item, idx) => (
                      <img
                        key={idx}
                        src={item.thumbnail}
                        alt=""
                        className="w-10 h-12 object-cover border"
                      />
                    ))}
                    <span className="text-xs text-neutral-400 font-semibold pl-2">
                      {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto border-t md:border-none pt-3 md:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-dark">₹{ord.grandTotal.toLocaleString('en-IN')}</span>
                    <ThreeDotMenu
                      id={ord._id}
                      items={buildMenuItems(ord)}
                      menuTitle="Order Actions"
                      sheetTitle="Order Actions"
                      subtitle={`Order #${ord.orderNumber} • ₹${ord.grandTotal.toLocaleString('en-IN')}`}
                      ariaLabel={`Actions for order ${ord.orderNumber}`}
                      disabled={busyId === ord._id}
                    />
                  </div>
                  <Link
                    href={`/orders/${ord._id}`}
                    className="text-xs font-bold text-brand hover:underline flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    Track Order <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
}
