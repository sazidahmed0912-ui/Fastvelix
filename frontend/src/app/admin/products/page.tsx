'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, Store, ShoppingBag, Undo2, History, ArrowLeft, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface ProductMod {
  _id: string;
  title: string;
  topLevelCategory: 'FASHION' | 'CAKES_AND_BAKES';
  thumbnail: string;
  salePrice: number;
  createdAt: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductMod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [modNote, setModNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingProducts();
  }, []);

  async function loadPendingProducts() {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; products: ProductMod[] }>('/admin/products?status=PENDING_REVIEW');
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleModeration = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    setActiveProductId(id);
    setSubmitting(true);
    try {
      const data = await api.put<{ success: boolean }>(`/admin/products/${id}/moderate`, {
        status,
        note: modNote || `Moderated by admin. Set to ${status.toLowerCase()}`,
      });

      if (data.success) {
        alert(`Product listing has been ${status === 'ACTIVE' ? 'approved' : 'rejected'}!`);
        setModNote('');
        loadPendingProducts();
      }
    } catch (err: any) {
      alert(err.message || 'Moderation failed.');
    } finally {
      setSubmitting(false);
      setActiveProductId(null);
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
            <h1 className="text-2xl font-bold tracking-tight uppercase">Catalog Moderation Queue</h1>
            <p className="text-sm text-neutral-500 mt-1">Review new and updated merchant product draft submissions.</p>
          </div>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 h-10 px-5 bg-stone-900 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-stone-800 transition-colors shrink-0"
          >
            <Plus size={14} />
            Add Product
          </Link>
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
            <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
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
              <p className="text-sm text-neutral-400 animate-pulse">Loading catalog moderation list...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center bg-white border">No products awaiting moderation review.</p>
            ) : (
              <div className="space-y-6">
                {products.map((p) => (
                  <div key={p._id} className="border border-neutral-200 bg-white p-6 shadow-sm-custom space-y-4">
                    
                    {/* Header */}
                    <div className="flex gap-4">
                      <img src={p.thumbnail || 'https://via.placeholder.com/80'} className="w-16 h-20 object-cover border shrink-0 bg-neutral-50" alt="" />
                      <div className="text-xs">
                        <span className="px-2 py-0.5 bg-neutral-100 text-[9px] uppercase font-bold tracking-wider rounded-none">{p.topLevelCategory}</span>
                        <h4 className="font-bold text-sm text-dark mt-1.5">{p.title}</h4>
                        <p className="text-neutral-400 mt-0.5">Price Rate: <strong>₹{p.salePrice}</strong></p>
                        <p className="text-neutral-500 mt-1">Submitted by: <strong className="text-dark">{p.sellerId?.name} ({p.sellerId?.email})</strong></p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="border-t border-neutral-100 pt-4 flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Moderator review feedback/note..."
                        value={activeProductId === p._id ? modNote : ''}
                        onChange={(e) => {
                          setActiveProductId(p._id);
                          setModNote(e.target.value);
                        }}
                        className="w-full h-10 px-3 border border-neutral-200 text-xs focus:outline-none bg-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModeration(p._id, 'ACTIVE')}
                          disabled={submitting && activeProductId === p._id}
                          className="h-9 px-4 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 size={14} /> Approve listing
                        </button>
                        <button
                          onClick={() => handleModeration(p._id, 'REJECTED')}
                          disabled={submitting && activeProductId === p._id}
                          className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle size={14} /> Reject listing
                        </button>
                      </div>
                    </div>

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
