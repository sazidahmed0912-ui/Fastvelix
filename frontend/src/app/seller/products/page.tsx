'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Settings, Plus, Eye, Trash2, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

export default function SellerProductsPage() {
  const { user } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerProducts();
  }, []);

  async function loadSellerProducts() {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; products: any[] }>('/seller/products');
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load seller catalog:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this product listing?')) return;
    try {
      const data = await api.delete<{ success: boolean }>(`/products/${id}`);
      if (data.success) {
        loadSellerProducts();
      }
    } catch (err: any) {
      alert(err.message || 'Deactivate failed.');
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
            <h1 className="text-2xl font-bold tracking-tight uppercase">My Product Catalogue</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage and edit your listed items.</p>
          </div>
          <Link
            href="/seller/products/new"
            className="h-10 px-4 bg-brand text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Navbar */}
          <aside className="border-r border-neutral-100 pr-0 lg:pr-6 space-y-1">
            <Link href="/seller" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link href="/seller/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
              <ShoppingBag size={16} /> My Products
            </Link>
            <Link href="/seller/orders" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingCart size={16} /> Order Fulfillments
            </Link>
            <Link href="/seller/profile" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Settings size={16} /> Store Profile
            </Link>
          </aside>

          {/* Catalog grid details */}
          <div className="lg:col-span-3">
            {loading ? (
              <p className="text-sm text-neutral-400 animate-pulse">Loading listed catalogue...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center bg-white border">No products listed yet.</p>
            ) : (
              <div className="border border-neutral-200 bg-white shadow-sm-custom overflow-x-auto rounded-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 font-extrabold uppercase border-b border-neutral-200">
                      <th className="p-4">Product Details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium">
                    {products.map((p) => {
                      const detailUrl = `/${p.topLevelCategory.toLowerCase()}/${p.slug}`;
                      return (
                        <tr key={p._id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="p-4 flex gap-3 items-center">
                            <img src={p.thumbnail || 'https://via.placeholder.com/80'} className="w-10 h-12 object-cover border" alt="" />
                            <div>
                              <span className="font-bold text-dark block text-sm">{p.title}</span>
                              <span className="text-[10px] text-neutral-400">ID: {p._id.slice(-8).toUpperCase()}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-neutral-100 text-[10px] uppercase font-bold tracking-wider">{p.topLevelCategory}</span>
                          </td>
                          <td className="p-4">
                            <span className={clsx(
                              "font-bold uppercase tracking-wider text-[9px]",
                              p.status === 'ACTIVE' && "text-brand",
                              p.status === 'DRAFT' && "text-neutral-400",
                              p.status === 'PENDING_REVIEW' && "text-orange-500",
                              p.status === 'INACTIVE' && "text-red-500"
                            )}>
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-sm">₹{p.salePrice}</td>
                          <td className="p-4 font-semibold">{p.totalStock} units</td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-3">
                              {p.status === 'ACTIVE' && (
                                <Link href={detailUrl} className="text-neutral-500 hover:text-dark p-1 cursor-pointer">
                                  <Eye size={15} />
                                </Link>
                              )}
                              <button onClick={() => handleDelete(p._id)} className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
