'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, Store, ShoppingBag, Undo2, History, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface RefundRequest {
  _id: string;
  amount: number;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  userId: {
    name: string;
    email: string;
  };
  orderId: {
    orderNumber: string;
  };
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRefundId, setActiveRefundId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRefundRequests();
  }, []);

  async function loadRefundRequests() {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; refunds: RefundRequest[] }>('/admin/refunds');
      if (data.success) {
        setRefunds(data.refunds);
      }
    } catch (err) {
      console.error('Failed to load refund requests:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleProcessRefund = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActiveRefundId(id);
    setSubmitting(true);
    try {
      const data = await api.put<{ success: boolean }>(`/admin/refunds/${id}/process`, {
        action,
        note: note || `Refund request ${action.toLowerCase()}d by admin.`,
      });

      if (data.success) {
        alert(`Refund successfully ${action === 'APPROVE' ? 'approved & issued via Razorpay' : 'rejected'}!`);
        setNote('');
        loadRefundRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Refund processing failed.');
    } finally {
      setSubmitting(false);
      setActiveRefundId(null);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-dark">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-neutral-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Refund & Reimbursements</h1>
            <p className="text-sm text-neutral-500 mt-1">Review refund requests and process payouts through active payment channels.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Navbar */}
          <aside className="border-r border-neutral-100 pr-0 lg:pr-6 space-y-1">
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <LayoutDashboard size={16} /> Overview
            </Link>
            <Link href="/admin/sellers" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Store size={16} /> Seller Applications
            </Link>
            <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingBag size={16} /> Product Approvals
            </Link>
            <Link href="/admin/refunds" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
              <Undo2 size={16} /> Refund Requests
            </Link>
            <Link href="/admin/audit-logs" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <History size={16} /> System Audit Logs
            </Link>
          </aside>

          {/* Main Applications Table */}
          <div className="lg:col-span-3">
            {loading ? (
              <p className="text-sm text-neutral-400 animate-pulse">Loading refunds list...</p>
            ) : refunds.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center bg-white border">No pending refund requests found.</p>
            ) : (
              <div className="space-y-6">
                {refunds.map((ref) => (
                  <div key={ref._id} className="border border-neutral-200 bg-white p-6 shadow-sm-custom space-y-4">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start pb-3 border-b border-neutral-100 text-xs">
                      <div>
                        <span className="font-extrabold text-sm block">Refund Request: ₹{ref.amount}</span>
                        <span className="text-neutral-400">Order Ref: <strong>#{ref.orderId?.orderNumber}</strong></span>
                      </div>
                      <span className="font-extrabold uppercase px-2 py-0.5 bg-neutral-100 text-neutral-600 tracking-widest text-[9px]">
                        {ref.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                      <div>
                        <p className="text-neutral-400 uppercase font-bold">Requesting Customer</p>
                        <p className="text-dark font-semibold mt-0.5">{ref.userId?.name} ({ref.userId?.email})</p>
                        <p className="text-neutral-400 mt-1">Submitted: {new Date(ref.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 uppercase font-bold">Refund Details</p>
                        <p className="text-dark font-semibold mt-0.5">Reason: {ref.reason.replace('_', ' ')}</p>
                        {ref.description && <p className="text-neutral-500 mt-1 leading-relaxed">Details: {ref.description}</p>}
                      </div>
                    </div>

                    {/* Controls */}
                    {['REQUESTED', 'APPROVED'].includes(ref.status) && (
                      <div className="border-t border-neutral-100 pt-4 flex flex-col gap-3">
                        <input
                          type="text"
                          placeholder="Rejection feedback or approval note..."
                          value={activeRefundId === ref._id ? note : ''}
                          onChange={(e) => {
                            setActiveRefundId(ref._id);
                            setNote(e.target.value);
                          }}
                          className="w-full h-10 px-3 border border-neutral-200 text-xs focus:outline-none bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessRefund(ref._id, 'APPROVE')}
                            disabled={submitting && activeRefundId === ref._id}
                            className="h-9 px-4 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> Approve & Issue via Razorpay
                          </button>
                          <button
                            onClick={() => handleProcessRefund(ref._id, 'REJECT')}
                            disabled={submitting && activeRefundId === ref._id}
                            className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle size={14} /> Reject Request
                          </button>
                        </div>
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
