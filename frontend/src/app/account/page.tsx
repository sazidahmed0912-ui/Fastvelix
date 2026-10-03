'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { api } from '@/utils/api';
import {
  User as UserIcon,
  Package,
  MapPin,
  Heart,
  Bell,
  LogOut,
  ShieldCheck,
  Tag,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

export default function AccountOverviewPage() {
  const router = useRouter();
  const { user, logout } = useStore();

  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get<{ success: boolean; pagination: { total: number } }>('/orders?limit=1');
        if (data.success) {
          setOrdersCount(data.pagination.total);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadStats();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return null;

  const cards = [
    { name: 'My Orders', desc: `Track or cancel orders (${ordersCount} total)`, href: '/account/orders', icon: Package, color: 'text-blue-500 bg-blue-50' },
    { name: 'FastVelix Wallet', desc: 'Manage store balance & 1-click refunds', href: '/account/wallet', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
    { name: 'Refer & Earn', desc: 'Invite friends and get ₹100 reward', href: '/account/referrals', icon: Tag, color: 'text-purple-600 bg-purple-50' },
    { name: 'Shipping Addresses', desc: 'Manage your shipping drop-offs', href: '/account/addresses', icon: MapPin, color: 'text-green-500 bg-green-50' },
    { name: 'My Wishlist', desc: 'Products you\'ve marked for later', href: '/account/wishlist', icon: Heart, color: 'text-red-500 bg-red-50' },
    { name: 'Account Security', desc: 'Change password & active sessions', href: '/account/security', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Notifications', desc: 'Stay updated with orders & reviews', href: '/account/notifications', icon: Bell, color: 'text-yellow-500 bg-yellow-50' },
    { name: 'Coupons & Offers', desc: 'Exclusive promo codes & deals', href: '/offers', icon: Tag, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
      <div className="space-y-1">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider mb-6">
          <span>Home</span>
          <ChevronRight size={12} />
          <span className="text-dark">My Account</span>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-neutral-200 p-8 shadow-sm-custom mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-neutral-100 flex items-center justify-center text-neutral-400 border rounded-full">
              <UserIcon size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-dark">{user.name}</h2>
              <p className="text-sm text-neutral-500">{user.email}</p>
              <div className="flex gap-2 mt-1.5">
                <span className="text-[9px] bg-dark text-white font-extrabold uppercase px-2 py-0.5 tracking-wider">
                  {user.role}
                </span>
                {user.isEmailVerified ? (
                  <span className="text-[9px] bg-brand text-white font-extrabold uppercase px-2 py-0.5 tracking-wider">Verified</span>
                ) : (
                  <span className="text-[9px] bg-red-500 text-white font-extrabold uppercase px-2 py-0.5 tracking-wider">Unverified</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="h-10 px-4 border border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut size={14} /> Logout Session
          </button>
        </div>

        {/* Nav Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.name}
              href={card.href}
              className="border border-neutral-200 p-6 bg-white flex items-center justify-between hover-lift shadow-sm-custom group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={clsx("p-3 rounded-full shrink-0", card.color)}>
                  <card.icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-dark group-hover:text-brand transition-colors">{card.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{card.desc}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-300 group-hover:text-dark transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    );
}
