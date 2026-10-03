'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore, TopLevelCategory } from '@/store/useStore';
import { CheckCircle2, ChevronRight, Package, Truck, Compass, Calendar, AlertCircle, FileText } from 'lucide-react';
import { clsx } from 'clsx';

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

function OrderDetailContent({ params }: OrderDetailPageProps) {
  const router = useRouter();
  const { user } = useStore();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const paymentMethod = searchParams.get('method');

  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [returning, setReturning] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    params.then((res) => setOrderId(res.orderId));
  }, [params]);

  useEffect(() => {
    if (!orderId) return;
    loadOrderDetails();
  }, [orderId]);

  async function loadOrderDetails() {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; order: any }>(`/orders/${orderId}`);
      if (data.success) {
        setOrder(data.order);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const data = await api.post<{ success: boolean; order: any }>(`/orders/${orderId}/cancel`, {
        reason: 'Cancelled by customer',
      });
      if (data.success) {
        setActionMsg('Order cancelled successfully.');
        setOrder(data.order);
      }
    } catch (err: any) {
      setActionMsg(err.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnOrder = async () => {
    if (!confirm('Are you sure you want to request a return for this order?')) return;
    setReturning(true);
    try {
      const data = await api.post<{ success: boolean; order: any }>(`/orders/${orderId}/return`, {
        reason: 'Return requested by customer',
      });
      if (data.success) {
        setActionMsg('Return request submitted successfully.');
        setOrder(data.order);
      }
    } catch (err: any) {
      setActionMsg(err.message || 'Return request failed.');
    } finally {
      setReturning(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-sm text-neutral-400 animate-pulse">
          Loading order details...
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-xl font-bold">Order Not Found</h2>
          <p className="text-sm text-neutral-500 mt-2">{error || 'This order does not exist or you do not have permission to view it.'}</p>
        </main>
        <Footer />
      </>
    );
  }

  const steps = [
    { name: 'Placed', status: 'PENDING' },
    { name: 'Confirmed', status: 'CONFIRMED' },
    { name: 'Processing', status: 'PROCESSING' },
    { name: 'Shipped', status: 'SHIPPED' },
    { name: 'Out for Delivery', status: 'OUT_FOR_DELIVERY' },
    { name: 'Delivered', status: 'DELIVERED' }
  ];

  // Map order status to steps index
  const statusIndexMap: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    OUT_FOR_DELIVERY: 4,
    DELIVERED: 5,
    CANCELLED: -1,
    RETURN_REQUESTED: -1,
    RETURNED: -1,
    REFUNDED: -1,
  };

  const currentStepIndex = statusIndexMap[order.status] ?? -1;
  const isCancelled = order.status === 'CANCELLED';
  const isReturnFlow = ['RETURN_REQUESTED', 'RETURNED', 'REFUND_PENDING', 'REFUNDED'].includes(order.status);

  // Return window check (7 days)
  const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date();
  const returnExpiry = new Date(deliveredDate.getTime() + (order.items[0]?.returnWindow || 7) * 24 * 60 * 60 * 1000);
  const isWithinReturnWindow = new Date() <= returnExpiry;

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        
        {/* Order Success Banner */}
        {isSuccess && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 flex items-start gap-4">
            <div className="mt-0.5 shrink-0">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-green-800 text-base">
                {paymentMethod === 'cod' ? '🎉 Order Placed Successfully! (Cash on Delivery)' : '🎉 Payment Confirmed!'}
              </h2>
              <p className="text-xs text-green-700 mt-1">
                {paymentMethod === 'cod'
                  ? 'Thank you for your order. Pay in cash when your items arrive.'
                  : 'Your payment was verified and your order has been confirmed.'}
              </p>
            </div>
          </div>
        )}

        {/* Action message (cancel/return feedback) */}
        {actionMsg && (
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-xs font-semibold text-blue-700">
            {actionMsg}
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider mb-6">
          <span>Home</span>
          <ChevronRight size={12} />
          <span>Orders</span>
          <ChevronRight size={12} />
          <span className="text-dark">Order #{order.orderNumber}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Details */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 text-white",
                  order.status === 'DELIVERED' && "bg-brand",
                  order.status === 'CANCELLED' && "bg-red-500",
                  isReturnFlow && "bg-orange-500",
                  !['DELIVERED', 'CANCELLED'].includes(order.status) && !isReturnFlow && "bg-dark"
                )}>
                  Status: {order.status.replace('_', ' ')}
                </span>
                <h1 className="text-xl font-extrabold text-dark mt-2">Order #{order.orderNumber}</h1>
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                  <Calendar size={13} /> Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => router.push(`/orders/${order._id}/invoice`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-dark font-bold text-xs uppercase tracking-wider border border-neutral-300 cursor-pointer transition-colors"
                  >
                    <FileText size={14} className="text-brand" /> Download Tax Invoice / Bill
                  </button>
                </div>
              </div>

              {/* Cancel Button / Action Trigger */}
              {['PENDING', 'CONFIRMED'].includes(order.status) && (
                <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Reason for cancellation..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="text-xs border border-neutral-200 px-3 py-1.5 h-9 w-full sm:w-48 bg-white focus:outline-none"
                  />
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer w-full sm:w-auto transition-colors"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              )}

              {/* Return Button */}
              {order.status === 'DELIVERED' && isWithinReturnWindow && (
                <button
                  onClick={handleReturnOrder}
                  disabled={returning}
                  className="h-10 px-5 border border-brand text-brand hover:bg-brand-light font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  {returning ? 'Submitting...' : 'Request Return / Refund'}
                </button>
              )}
            </div>

            {/* TRACKING TIMELINE */}
            {!isCancelled && !isReturnFlow && (
              <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom space-y-8">
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100 flex items-center gap-1.5">
                  <Truck size={14} className="text-brand" /> Tracking Status
                </h3>
                
                {/* Timeline progress line */}
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2">
                  <div className="absolute left-3.5 md:left-0 md:top-3.5 top-0 bottom-0 md:bottom-auto right-auto md:right-0 h-full md:h-1 bg-neutral-100 -z-10 w-1 md:w-full" />
                  
                  {steps.map((st, idx) => {
                    const isDone = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div key={st.status} className="flex md:flex-col items-center gap-3 md:gap-2 relative z-10">
                        <div
                          className={clsx(
                            "h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs bg-white transition-all",
                            isDone ? "border-brand text-brand bg-brand-light" : "border-neutral-200 text-neutral-400",
                            isCurrent && "ring-4 ring-brand/10 border-brand"
                          )}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span
                          className={clsx(
                            "text-[10px] md:text-center font-extrabold uppercase tracking-wide",
                            isDone ? "text-dark" : "text-neutral-400"
                          )}
                        >
                          {st.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {order.trackingNumber && (
                  <div className="bg-neutral-50 p-4 border border-neutral-200 text-xs text-neutral-500">
                    <p>Carrier Provider: <strong>{order.shippingCarrier || 'FastVelix Logistics'}</strong></p>
                    <p className="mt-1">Tracking ID Reference: <strong className="text-dark">{order.trackingNumber}</strong></p>
                  </div>
                )}
              </div>
            )}

            {/* If Cancelled notice */}
            {isCancelled && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs flex items-start gap-2 shadow-sm-custom">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-bold text-sm">Order Cancelled</h4>
                  <p className="mt-1">Reason: {order.cancellationReason || 'Cancelled by customer'}</p>
                </div>
              </div>
            )}

            {/* List of snapshot items */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100 flex items-center gap-1.5">
                <Package size={14} className="text-brand" /> Items Snapshot
              </h3>
              
              <div className="divide-y divide-neutral-100">
                {order.items.map((item: any) => (
                  <div key={item.sku} className="py-4 flex justify-between gap-4">
                    <div className="flex gap-4">
                      <img src={item.thumbnail} className="w-16 h-20 object-cover border" alt="" />
                      <div className="text-xs">
                        <span className="font-bold text-dark text-sm block">{item.title}</span>
                        <div className="flex gap-4 text-neutral-400 mt-1">
                          <span>SKU: {item.sku}</span>
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                          {item.packSize && <span>Pack Size: {item.packSize}</span>}
                        </div>
                        <span className="block mt-2 font-semibold">₹{item.unitPrice} &times; {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Summary Column */}
          <div className="space-y-6">
            
            {/* Address Delivery */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100 mb-3">
                Delivery Address
              </h3>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-dark">{order.deliveryAddress.fullName}</h4>
                <p className="text-neutral-500 leading-relaxed">
                  {order.deliveryAddress.addressLine1}
                  {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                  <br />
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                </p>
                <p className="text-neutral-600 font-semibold pt-1">Phone: {order.deliveryAddress.phone}</p>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100 mb-2">
                Order Payment Summary
              </h3>
              
              <div className="text-xs space-y-2 text-neutral-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-dark font-medium">₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-brand font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{order.couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxes (5% GST)</span>
                  <span className="text-dark font-medium">₹{order.taxTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="text-dark font-medium">
                    {order.shippingFee === 0 ? <span className="text-brand font-bold uppercase text-[10px]">FREE</span> : `₹${order.shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-dark font-extrabold text-sm pt-3 border-t border-neutral-100">
                  <span>Grand Total</span>
                  <span>₹{order.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-neutral-50 p-3 mt-4 text-[10px] text-neutral-400 space-y-1">
                <p>Payment Method: <strong className="text-dark uppercase">{order.paymentMethod}</strong></p>
                <p>Transaction Status: <strong className="text-dark uppercase">{order.paymentStatus}</strong></p>
              </div>
            </div>

          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
