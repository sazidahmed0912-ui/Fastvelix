'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { getSocket } from '@/lib/socket';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  ShoppingCart,
  DollarSign,
  ShieldCheck,
  History,
  Undo2,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  Sparkles,
  Cake,
  Shirt,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalSellers: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  pendingReviews: number;
  pendingSellerApplications: number;
  pendingRefunds: number;
}

export default function AdminDashboardPage() {
  const { user } = useStore();

  const [timeframe, setTimeframe] = useState('30d');
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Admin Monitor Stats (from Fzokart)
  const [monitorStats, setMonitorStats] = useState<{
    activeUsers: number;
    serverLoad: number;
    memoryUsage: number;
    uptime: number;
    systemStatus: string;
    activeUserList: any[];
  } | null>(null);

  const fetchAdminStats = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await api.get<{
        success: boolean;
        stats: Stats;
        revenueByCategory: any[];
        recentOrders: any[];
        recentActivity: any[];
      }>(`/admin/dashboard?timeframe=${timeframe}`);
      if (data.success) {
        setStats(data.stats);
        setRevenueByCategory(data.revenueByCategory);
        setRecentOrders(data.recentOrders || []);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, [timeframe]);

  // Real-time Socket.IO Connection for Live Admin Dashboard Updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_admin_dashboard');

    const handleDashboardEvent = () => {
      fetchAdminStats();
    };

    socket.on('NEW_ORDER_CREATED', handleDashboardEvent);
    socket.on('PAYMENT_CONFIRMED', handleDashboardEvent);
    socket.on('SELLER_APPLICATION_SUBMITTED', handleDashboardEvent);
    socket.on('PRODUCT_SUBMITTED', handleDashboardEvent);

    return () => {
      socket.off('NEW_ORDER_CREATED', handleDashboardEvent);
      socket.off('PAYMENT_CONFIRMED', handleDashboardEvent);
      socket.off('SELLER_APPLICATION_SUBMITTED', handleDashboardEvent);
      socket.off('PRODUCT_SUBMITTED', handleDashboardEvent);
    };
  }, [timeframe]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-neutral-400">
          <div className="h-8 w-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading production dashboard metrics...
        </main>
        <Footer />
      </>
    );
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
          <p className="text-xs text-neutral-500 mt-2">Administrative privileges required to access this portal.</p>
        </main>
        <Footer />
      </>
    );
  }

  const statCards = [
    { name: 'Gross Revenue (GMV)', val: `₹${stats?.totalRevenue.toLocaleString('en-IN') || 0}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Total Orders Placed', val: stats?.totalOrders || 0, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { name: 'Registered Customers', val: stats?.totalCustomers || 0, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { name: 'Approved Merchants', val: stats?.totalSellers || 0, icon: Store, color: 'bg-amber-50 text-amber-600' },
    { name: 'Active Product Listings', val: stats?.activeProducts || 0, icon: ShoppingBag, color: 'bg-teal-50 text-teal-600' },
    { name: 'Low Stock Items (≤5)', val: stats?.lowStockProducts || 0, icon: AlertTriangle, color: 'bg-rose-50 text-rose-600' },
  ];

  const queues = [
    { name: 'Seller Applications', count: stats?.pendingSellerApplications || 0, href: '/admin/sellers', label: 'Needs Approval' },
    { name: 'Product Approval Queue', count: stats?.pendingReviews || 0, href: '/admin/products', label: 'Pending Review' },
    { name: 'Refund Request Queue', count: stats?.pendingRefunds || 0, href: '/admin/refunds', label: 'Needs Resolution' },
  ];

  const orderStatuses = [
    { label: 'Pending', count: stats?.pendingOrders || 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Processing', count: stats?.processingOrders || 0, icon: RefreshCw, color: 'text-blue-600 bg-blue-50' },
    { label: 'In Transit / Shipped', count: stats?.shippedOrders || 0, icon: Truck, color: 'text-purple-600 bg-purple-50' },
    { label: 'Delivered', count: stats?.deliveredOrders || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Cancelled', count: stats?.cancelledOrders || 0, icon: XCircle, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 w-full">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest">
              <ShieldCheck size={14} /> Production Admin Console
            </div>
            <h1 className="text-xl font-extrabold tracking-tight mt-0.5 text-stone-900">Platform Command Center</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-white border border-stone-200 p-1 rounded">
              <Calendar size={12} className="text-neutral-400 ml-1.5" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="text-xs font-semibold bg-transparent text-stone-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="12m">Last 12 Months</option>
              </select>
            </div>

            <button
              onClick={() => fetchAdminStats(true)}
              disabled={isRefreshing}
              className="h-8 px-3 border border-stone-300 text-stone-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 bg-white hover:bg-stone-100 transition-colors"
            >
              <RefreshCw size={12} className={clsx(isRefreshing && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Navigation Sidebar */}
          <aside className="w-full lg:w-56 shrink-0 bg-white border border-stone-200 p-2 space-y-1 rounded-lg shadow-sm">
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider bg-stone-900 text-white rounded">
              <LayoutDashboard size={15} /> Overview
            </Link>
            <Link href="/admin/sellers" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black hover:bg-stone-100 transition-colors rounded">
              <Store size={15} /> Sellers ({stats?.pendingSellerApplications || 0})
            </Link>
            <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black hover:bg-stone-100 transition-colors rounded">
              <ShoppingBag size={15} /> Product Approvals
            </Link>
            <Link href="/admin/cakes" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black hover:bg-stone-100 transition-colors rounded">
              <Cake size={15} /> Custom Cake Options
            </Link>
            <Link href="/admin/refunds" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black hover:bg-stone-100 transition-colors rounded">
              <Undo2 size={15} /> Refund Requests ({stats?.pendingRefunds || 0})
            </Link>
            <Link href="/admin/shipping" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black hover:bg-stone-100 transition-colors rounded">
              <Truck size={15} /> Shipping & Labels
            </Link>
            <Link href="/admin/homepage" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black hover:bg-stone-100 transition-colors rounded">
              <Sparkles size={15} /> Homepage Banners
            </Link>
            <Link href="/admin/audit-logs" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black hover:bg-stone-100 transition-colors rounded">
              <History size={15} /> Audit Logs
            </Link>
          </aside>

          {/* Main Dashboard Panel */}
          <div className="flex-1 min-w-0 space-y-6 w-full">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {statCards.map((card) => (
                <div key={card.name} className="border border-stone-200/90 p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">{card.name}</span>
                    <div className={clsx("p-1.5 rounded-full", card.color)}>
                      <card.icon size={15} />
                    </div>
                  </div>
                  <h3 className="text-xl font-extrabold mt-1 text-stone-900">{card.val}</h3>
                </div>
              ))}
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white border border-stone-200 p-4 rounded-lg shadow-sm">
              <h3 className="font-extrabold text-[11px] uppercase tracking-widest text-stone-400 mb-3 border-b pb-2">
                Order Pipeline Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {orderStatuses.map((st) => (
                  <div key={st.label} className="p-3 bg-stone-50 border border-stone-100 rounded-md flex flex-col justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={clsx("p-1 rounded", st.color)}>
                        <st.icon size={13} />
                      </div>
                      <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">{st.label}</span>
                    </div>
                    <span className="text-lg font-black text-stone-900 mt-2">{st.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Queues + Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Action Queues */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-[11px] uppercase tracking-widest text-stone-400">
                  Moderation Queues
                </h3>
                <div className="space-y-2.5">
                  {queues.map((q) => (
                    <Link
                      key={q.name}
                      href={q.href}
                      className="border border-stone-200 p-3.5 bg-white rounded-lg hover:border-stone-900 transition-all flex items-center justify-between shadow-sm cursor-pointer"
                    >
                      <div>
                        <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
                          {q.label}
                        </span>
                        <h4 className="font-bold text-xs text-stone-900 mt-1">{q.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-stone-900">{q.count}</span>
                        <span className="block text-[10px] font-bold text-stone-400">Action →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Category Sales Split */}
              <div className="bg-white border border-stone-200 p-4 rounded-lg shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-[11px] uppercase tracking-widest text-stone-400 mb-3 border-b pb-2">
                    Category Revenue Splits ({timeframe})
                  </h3>
                  <div className="space-y-4">
                    {revenueByCategory.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-6 text-center">No category sales data for this range.</p>
                    ) : (
                      revenueByCategory.map((cat) => {
                        const isFashion = cat._id === 'FASHION';
                        const totalRev = revenueByCategory.reduce((sum, item) => sum + item.revenue, 0) || 1;
                        const pct = Math.round((cat.revenue / totalRev) * 100);
                        return (
                          <div key={cat._id} className="text-xs space-y-1.5">
                            <div className="flex justify-between font-bold">
                              <span className="flex items-center gap-1.5 text-stone-900">
                                {isFashion ? <Shirt size={14} /> : <Cake size={14} />}
                                <span>{isFashion ? 'Fashion Studio' : 'Cakes & Bakes'}</span>
                                <span className="text-[10px] text-stone-400">({cat.count} items)</span>
                              </span>
                              <span className="font-mono">₹{cat.revenue.toLocaleString('en-IN')} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className={clsx("h-full transition-all duration-500", isFashion ? "bg-stone-900" : "bg-amber-600")}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Real Recent Orders Table */}
            <div className="bg-white border border-stone-200 p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-3 pb-2 border-b">
                <h3 className="font-extrabold text-[11px] uppercase tracking-widest text-stone-400">
                  Recent Orders Overview (Real MongoDB Database Records)
                </h3>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Total: {recentOrders.length} Recent
                </span>
              </div>

              {recentOrders.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">0 orders found in database.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-400 border-b">
                      <tr>
                        <th className="p-2">Order #</th>
                        <th className="p-2">Customer</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Payment</th>
                        <th className="p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {recentOrders.map((ord) => (
                        <tr key={ord._id} className="hover:bg-stone-50/50">
                          <td className="p-2 font-mono font-bold text-stone-900">{ord.orderNumber}</td>
                          <td className="p-2 font-medium text-stone-700">{ord.userId?.name || 'Customer'}</td>
                          <td className="p-2 font-bold font-mono text-stone-900">₹{ord.grandTotal?.toLocaleString('en-IN')}</td>
                          <td className="p-2">
                            <span className={clsx(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                              ord.status === 'DELIVERED' ? "bg-emerald-100 text-emerald-800" :
                              ord.status === 'CANCELLED' ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                            )}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={clsx(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                              ord.paymentStatus === 'PAID' ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"
                            )}>
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="p-2 text-[10px] text-stone-400 font-mono">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Live Audit Activity Log */}
            <div className="bg-white border border-stone-200 p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-3 pb-2 border-b">
                <h3 className="font-extrabold text-[11px] uppercase tracking-widest text-stone-400">
                  Live Audit Trail &amp; System Events
                </h3>
                <Link href="/admin/audit-logs" className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-black">
                  View Full Logs →
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">No system events logged yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {recentActivity.map((act) => (
                    <div key={act._id} className="flex justify-between items-center text-xs p-2 bg-stone-50 rounded border border-stone-100">
                      <div>
                        <span className="font-bold text-stone-900">{act.action}</span>
                        <span className="text-stone-500 text-[10px] ml-2">by {act.actor?.name || 'System Admin'}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
