'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, Store, ShoppingBag, Undo2, History, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Application {
  _id: string;
  businessName: string;
  businessType: string;
  gstin?: string;
  pan?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: {
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  requestedCategories: ('FASHION' | 'CAKES_AND_BAKES')[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}

export default function AdminSellersPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; applications: Application[] }>('/admin/seller-applications');
      if (data.success) {
        setApps(data.applications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActiveAppId(id);
    setSubmitting(true);
    try {
      const data = await api.put<{ success: boolean }>(`/admin/seller-applications/${id}/review`, {
        status,
        note: reviewNote || `Reviewed by admin. Application ${status.toLowerCase()}`,
        categoryPermissions: ['FASHION', 'CAKES_AND_BAKES'],
      });

      if (data.success) {
        alert(`Application successfully ${status.toLowerCase()}!`);
        setReviewNote('');
        loadApplications();
      }
    } catch (err: any) {
      alert(err.message || 'Review failed.');
    } finally {
      setSubmitting(false);
      setActiveAppId(null);
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
            <h1 className="text-2xl font-bold tracking-tight uppercase">Merchant Registrations</h1>
            <p className="text-sm text-neutral-500 mt-1">Review and verify seller applications.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Navbar */}
          <aside className="border-r border-neutral-100 pr-0 lg:pr-6 space-y-1">
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <LayoutDashboard size={16} /> Overview
            </Link>
            <Link href="/admin/sellers" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
              <Store size={16} /> Seller Applications
            </Link>
            <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingBag size={16} /> Product Approvals
            </Link>
            <Link href="/admin/refunds" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Undo2 size={16} /> Refund Requests
            </Link>
            <Link href="/admin/audit-logs" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <History size={16} /> System Audit Logs
            </Link>
          </aside>

          {/* Main Applications Table */}
          <div className="lg:col-span-3">
            {loading ? (
              <p className="text-sm text-neutral-400 animate-pulse">Loading application list...</p>
            ) : apps.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center bg-white border">No pending applications found.</p>
            ) : (
              <div className="space-y-6">
                {apps.map((app) => (
                  <div key={app._id} className="border border-neutral-200 bg-white p-6 shadow-sm-custom space-y-4">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start pb-3 border-b border-neutral-100 text-xs">
                      <div>
                        <h4 className="font-extrabold text-sm text-dark">{app.businessName}</h4>
                        <p className="text-neutral-400 mt-0.5">Entity Type: {app.businessType}</p>
                      </div>
                      <span className={clsx(
                        "font-extrabold uppercase px-2 py-0.5 text-white tracking-widest text-[9px]",
                        app.status === 'APPROVED' && "bg-brand",
                        app.status === 'REJECTED' && "bg-red-500",
                        !['APPROVED', 'REJECTED'].includes(app.status) && "bg-orange-500"
                      )}>
                        {app.status}
                      </span>
                    </div>

                    {/* Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <p className="text-neutral-400 uppercase font-bold">Contact Person</p>
                        <p className="font-semibold text-dark">{app.contactName}</p>
                        <p className="text-neutral-500">{app.contactEmail} | {app.contactPhone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-neutral-400 uppercase font-bold">Warehouse Address</p>
                        <p className="text-neutral-500">
                          {app.businessAddress.addressLine1}, {app.businessAddress.city}, {app.businessAddress.state} - {app.businessAddress.pincode}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-400 uppercase font-bold mb-1">Requested Verticals</p>
                        <div className="flex gap-1.5">
                          {app.requestedCategories.map((c) => (
                            <span key={c} className="px-2 py-0.5 bg-neutral-100 text-[9px] uppercase font-bold tracking-wider rounded-none">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {app.gstin && (
                          <div>
                            <p className="text-neutral-400 uppercase font-bold">GSTIN</p>
                            <p className="font-semibold">{app.gstin}</p>
                          </div>
                        )}
                        {app.pan && (
                          <div>
                            <p className="text-neutral-400 uppercase font-bold">PAN</p>
                            <p className="font-semibold">{app.pan}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Moderation Controls */}
                    {['SUBMITTED', 'UNDER_REVIEW'].includes(app.status) && (
                      <div className="border-t border-neutral-100 pt-4 flex flex-col gap-3">
                        <input
                          type="text"
                          placeholder="Verification feedback/review note..."
                          value={activeAppId === app._id ? reviewNote : ''}
                          onChange={(e) => {
                            setActiveAppId(app._id);
                            setReviewNote(e.target.value);
                          }}
                          className="w-full h-10 px-3 border border-neutral-200 text-xs focus:outline-none bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(app._id, 'APPROVED')}
                            disabled={submitting && activeAppId === app._id}
                            className="h-9 px-4 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> Approve Merchant
                          </button>
                          <button
                            onClick={() => handleReview(app._id, 'REJECTED')}
                            disabled={submitting && activeAppId === app._id}
                            className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle size={14} /> Reject Application
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
