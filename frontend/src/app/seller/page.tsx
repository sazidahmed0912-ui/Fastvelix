'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, ShoppingBag, ShoppingCart, BarChart3, Settings, AlertTriangle, ShieldCheck, Truck } from 'lucide-react';
import { clsx } from 'clsx';

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue30d: number;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user } = useStore();

  const [stats, setStats] = useState<Stats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; stats: Stats; lowStockProducts: any[]; seller: any }>('/seller/dashboard');
        if (data.success) {
          setStats(data.stats);
          setLowStockProducts(data.lowStockProducts);
          setSellerProfile(data.seller);
        }
      } catch (err: any) {
        console.error('Failed to load seller dashboard details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-sm text-neutral-400 animate-pulse">
          Loading seller panel...
        </main>
        <Footer />
      </>
    );
  }

  // Redirect if not seller
  if (user?.role !== 'SELLER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-neutral-500 mt-2">You need a registered & approved seller account to view this panel.</p>
        </main>
        <Footer />
      </>
    );
  }

  const statCards = [
    { name: 'Total Revenue (30d)', val: `₹${stats?.revenue30d.toLocaleString('en-IN') || 0}`, desc: 'Paid transactions' },
    { name: 'Active Catalog Items', val: stats?.activeProducts || 0, desc: `Out of ${stats?.totalProducts || 0} total` },
    { name: 'Total Orders Fulfilling', val: stats?.totalOrders || 0, desc: `${stats?.pendingOrders || 0} pending action` },
  ];

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-brand font-extrabold uppercase tracking-widest">
              <ShieldCheck size={14} /> Approved Merchant Partner
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">{sellerProfile?.businessName || 'Merchant Panel'}</h1>
          </div>
          
          <div className="flex gap-3">
            <Link href="/seller/products/new" className="h-10 px-4 bg-brand text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer">
              Create Product
            </Link>
            <Link href="/seller/orders" className="h-10 px-4 border border-dark text-dark font-bold text-xs uppercase tracking-wider flex items-center justify-center hover:bg-neutral-50 cursor-pointer">
              Manage Orders
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Navbar */}
          <aside className="border-r border-neutral-100 pr-0 lg:pr-6 space-y-1">
            <Link href="/seller" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link href="/seller/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingBag size={16} /> My Products
            </Link>
            <Link href="/seller/orders" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingCart size={16} /> Order Fulfillments
            </Link>
            <Link href="/seller/profile" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Settings size={16} /> Store Profile
            </Link>
          </aside>

          {/* Main Stats Block */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {statCards.map((card) => (
                <div key={card.name} className="border border-neutral-200 p-6 bg-white shadow-sm-custom">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{card.name}</span>
                  <h3 className="text-2xl font-extrabold mt-2 text-dark">{card.val}</h3>
                  <p className="text-[11px] text-neutral-400 mt-1 font-medium">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-yellow-500" /> Low Stock Alerts
              </h3>

              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-6">All active catalog stock levels are sufficient.</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {lowStockProducts.map((p) => (
                    <div key={p._id} className="py-3.5 flex justify-between items-center text-xs">
                      <div className="flex gap-3">
                        <img src={p.thumbnail} className="w-8 h-10 object-cover border" alt="" />
                        <div>
                          <span className="font-bold text-dark block">{p.title}</span>
                          <span className="text-neutral-400">Available Stock: {p.totalStock}</span>
                        </div>
                      </div>
                      
                      <Link
                        href={`/seller/products/${p._id}/edit`}
                        className="text-xs font-bold text-brand hover:underline uppercase tracking-wider"
                      >
                        Restock Inventory
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
