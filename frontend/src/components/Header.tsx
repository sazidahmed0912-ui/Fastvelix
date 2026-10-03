'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useStore, TopLevelCategory } from '@/store/useStore';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  X,
  MapPin,
  Bell,
  LogOut,
  ChevronDown,
  Compass,
  Grid,
  Tag
} from 'lucide-react';
import { clsx } from 'clsx';
import { api } from '@/utils/api';

function HeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const {
    user,
    category,
    setCategory,
    cart,
    wishlist,
    unreadNotifications,
    fetchUser,
    logout
  } = useStore();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState('Bengaluru, KA');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
    // Load category from session storage
    if (typeof window !== 'undefined') {
      const saved = window.sessionStorage.getItem('fv_category') as TopLevelCategory;
      if (saved && (saved === 'FASHION' || saved === 'CAKES_AND_BAKES')) {
        setCategory(saved);
      }
    }
  }, [fetchUser, setCategory]);

  useEffect(() => {
    // Close dropdowns on outer click
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&category=${category.toLowerCase()}`);
    }
  };

  const totalCartItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-neutral-100 shadow-sm-custom">
        {/* ROW 1: Logo, Location, Search, Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo + Location — desktop only. The mobile header is search-only. */}
          <div className="hidden lg:flex items-center gap-4">
            
            <Link href="/" className="flex items-center gap-1 font-bold text-2xl tracking-tight text-dark">
              FAST<span className="text-brand">VELIX</span>
            </Link>

            {/* Location Selector (Desktop) */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="hidden md:flex items-center gap-1 text-xs text-neutral-500 hover:text-dark border-l border-neutral-200 pl-4 h-6 ml-2 cursor-pointer transition-colors"
            >
              <MapPin size={14} className="text-brand" />
              <span>Deliver to: <span className="font-semibold text-dark">{location}</span></span>
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Product Search — the ONLY control in the mobile header bar */}
          <form onSubmit={handleSearchSubmit} className="lg:hidden flex-1 relative">
            <input
              type="text"
              placeholder={`Search ${category.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 pr-10 border border-neutral-200 focus:outline-none focus:border-dark text-sm transition-colors"
            />
            <button type="submit" className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-neutral-400 hover:text-dark cursor-pointer">
              <Search size={18} />
            </button>
          </form>

          {/* Large Product Search (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder={`Search for products, brands in ${category.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 pr-10 border border-neutral-200 rounded-none focus:outline-none focus:border-dark text-sm transition-colors"
            />
            <button type="submit" className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-neutral-400 hover:text-dark cursor-pointer">
              <Search size={18} />
            </button>
          </form>

          {/* Quick Actions — desktop only */}
          <div className="hidden lg:flex items-center gap-4 sm:gap-6" ref={dropdownRef}>

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-neutral-600 hover:text-dark relative p-1 cursor-pointer"
                >
                  <Bell size={22} />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-brand" />
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 shadow-md-custom py-2 z-50">
                    <div className="px-4 py-2 border-b border-neutral-100 font-semibold text-sm flex justify-between items-center">
                      <span>Notifications</span>
                      <Link href="/account/notifications" className="text-brand text-xs">View all</Link>
                    </div>
                    <div className="max-h-60 overflow-y-auto px-4 py-2 text-xs text-neutral-500">
                      {unreadNotifications === 0 ? (
                        <p className="text-center py-4">No new notifications</p>
                      ) : (
                        <p className="py-2">You have unread updates.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              className="text-neutral-600 hover:text-dark relative p-1 transition-colors"
            >
              <Heart size={22} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-dark text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="text-neutral-600 hover:text-dark relative p-1 transition-colors"
            >
              <ShoppingCart size={22} />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {/* Account dropdown */}
            <div className="relative">
              {user ? (
                <>
                  <button
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                    className="flex items-center gap-1 text-neutral-600 hover:text-dark font-medium text-sm cursor-pointer"
                  >
                    <UserIcon size={22} />
                    <span className="hidden sm:inline max-w-[80px] truncate">{user.name}</span>
                    <ChevronDown size={14} className="hidden sm:inline" />
                  </button>

                  {showAccountDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 shadow-md-custom py-1 z-50 rounded-none text-sm">
                      <div className="px-4 py-2 border-b border-neutral-100 text-xs text-neutral-400">
                        Logged in as <p className="font-semibold text-dark truncate">{user.email}</p>
                      </div>
                      
                      {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                        <Link href="/admin" className="block px-4 py-2 hover:bg-neutral-50 text-brand font-semibold">Admin Panel</Link>
                      ) : null}

                      {user.role === 'SELLER' ? (
                        <Link href="/seller" className="block px-4 py-2 hover:bg-neutral-50 text-brand font-semibold">Seller Panel</Link>
                      ) : null}

                      <Link href="/account" className="block px-4 py-2 hover:bg-neutral-50">My Profile</Link>
                      <Link href="/account/orders" className="block px-4 py-2 hover:bg-neutral-50">Orders</Link>
                      <Link href="/account/wishlist" className="block px-4 py-2 hover:bg-neutral-50">Wishlist</Link>
                      <button
                        onClick={() => {
                          logout();
                          router.push('/');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-red-500 flex items-center gap-2 border-t border-neutral-100 cursor-pointer"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-neutral-600 hover:text-dark font-medium text-sm transition-colors"
                >
                  <UserIcon size={22} />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        </header>

      {/* LOCATION PINCODE SELECTOR MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-sm w-full p-6 relative rounded-lg shadow-xl">
            <button
              onClick={() => setShowLocationModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-dark cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-base mb-1">Delivery Location</h3>
            <p className="text-xs text-neutral-500 mb-4">Enter your pincode to check instant time-slot delivery.</p>
            <input
              type="text"
              placeholder="e.g. 560001"
              maxLength={6}
              onChange={(e) => {
                if (e.target.value.length === 6) {
                  setLocation(`Pincode ${e.target.value}`);
                  setShowLocationModal(false);
                }
              }}
              className="w-full h-10 px-3 border border-neutral-300 rounded focus:outline-none focus:border-emerald-600 text-xs font-semibold"
            />
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-neutral-200 flex lg:hidden items-center justify-around z-40 shadow-lg">
        <Link href="/" className={clsx("flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors", pathname === '/' ? "text-emerald-700" : "text-neutral-500 hover:text-neutral-900")}>
          <Compass size={19} />
          <span>Home</span>
        </Link>
        <Link href={category === 'FASHION' ? '/fashion' : '/cakes-and-bakes'} className={clsx("flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors", (pathname.includes('/fashion') || pathname.includes('/cakes-and-bakes')) ? "text-emerald-700" : "text-neutral-500 hover:text-neutral-900")}>
          <Grid size={19} />
          <span>Shop</span>
        </Link>
        <Link href="/offers" className={clsx("flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors", pathname.includes('/offers') ? "text-amber-600" : "text-neutral-500 hover:text-neutral-900")}>
          <Tag size={19} />
          <span>Offers</span>
        </Link>
        <Link href="/cart" className={clsx("flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors relative", pathname.includes('/cart') ? "text-emerald-700" : "text-neutral-500 hover:text-neutral-900")}>
          <ShoppingCart size={19} />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[9px] font-extrabold text-white">
              {totalCartItems}
            </span>
          )}
          <span>Cart</span>
        </Link>
        <Link href={user ? "/account" : "/login"} className={clsx("flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors", pathname.includes('/account') || pathname.includes('/login') ? "text-emerald-700" : "text-neutral-500 hover:text-neutral-900")}>
          <UserIcon size={19} />
          <span>{user ? 'Account' : 'Login'}</span>
        </Link>
      </nav>
    </>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<header className="h-16 bg-white border-b border-neutral-100" />}>
      <HeaderContent />
    </Suspense>
  );
}
