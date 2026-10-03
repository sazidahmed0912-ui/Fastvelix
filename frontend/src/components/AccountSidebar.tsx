'use client';

/**
 * ══════════════════════════════════════════════════════════════
 * ⚡ FASTVELIX — ACCOUNT SIDEBAR
 * Design copied 1:1 from the Fzokart reference project
 * (frontend-next/app/components/Profile/ProfileSidebar.tsx).
 *
 * Behaviour copied exactly:
 *  • Desktop → fixed 280px column: "Hello, <name>" card on top,
 *    vertical menu list, logout row at the bottom.
 *  • Mobile  → single horizontally-scrollable pill row (no card).
 *  • Active item = solid accent pill (mobile) / tinted row + chevron
 *    (desktop).
 *  • Menu is driven by the current pathname for active state.
 * ══════════════════════════════════════════════════════════════
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Package,
  Wallet,
  Gift,
  Heart,
  Tag,
  Store,
  ShieldCheck,
  MapPin,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '@/store/useStore';

interface MenuEntry {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Only shown for these roles (undefined = everyone). */
  hideForRoles?: string[];
}

const MENU_ITEMS: MenuEntry[] = [
  { key: 'my_profile', label: 'My Profile', path: '/account', icon: User },
  { key: 'orders', label: 'Orders', path: '/account/orders', icon: Package },
  { key: 'wallet', label: 'Wallet', path: '/account/wallet', icon: Wallet },
  { key: 'referrals', label: 'Refer & Earn', path: '/account/referrals', icon: Gift },
  { key: 'wishlist', label: 'Wishlist', path: '/account/wishlist', icon: Heart },
  { key: 'notifications', label: 'Notifications', path: '/account/notifications', icon: Bell },
  { key: 'coupons', label: 'Coupons & Offers', path: '/offers', icon: Tag },
  {
    key: 'sell_on_fastvelix',
    label: 'Sell on FastVelix',
    path: '/become-seller',
    icon: Store,
    hideForRoles: ['SELLER', 'ADMIN', 'SUPER_ADMIN'],
  },
  { key: 'account_security', label: 'Account Security', path: '/account/security', icon: ShieldCheck },
  { key: 'address_book', label: 'Address Book', path: '/account/addresses', icon: MapPin },
  { key: 'help_center', label: 'Help Center', path: '/help-center', icon: HelpCircle },
];

const ACCENT = 'bg-brand text-white border-brand lg:bg-brand-light lg:text-brand lg:border-gray-50';
const ACCENT_ICON = 'text-white lg:text-brand';

export default function AccountSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (path: string) =>
    path === '/account' ? pathname === '/account' : pathname.startsWith(path);

  const visibleItems = MENU_ITEMS.filter(
    (item) => !item.hideForRoles || !item.hideForRoles.includes(user?.role ?? '')
  );

  return (
    <div className="w-full lg:w-[280px] flex-shrink-0 space-y-0 lg:space-y-4">
      {/* User Hello Card — Desktop Only (mobile has the scrollable pills) */}
      <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-4 hidden lg:flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center border border-neutral-200 overflow-hidden shrink-0">
          {user?.avatar ? (
            <img
              src={user.avatar.startsWith('http') ? user.avatar : `/${user.avatar}`}
              alt="User"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={20} className="text-brand" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-500 font-medium">Hello,</div>
          <div className="text-base font-bold text-[#1F2937] truncate">
            {user?.name || 'User'}
          </div>
        </div>
      </div>

      {/* Navigation Menu (Scrollable pills on mobile / column on desktop) */}
      <div className="bg-white rounded-xl shadow-none lg:shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible scrollbar-hide no-scrollbar py-0.5 md:py-1 lg:py-0 px-0 md:px-1 lg:px-0 gap-1.5 md:gap-2 lg:gap-0">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.key}
                href={item.path}
                className={clsx(
                  'flex items-center gap-1.5 md:gap-2 lg:gap-4 px-3 md:px-4 lg:px-6 py-1.5 md:py-2.5 lg:py-4 cursor-pointer transition-all border flex-shrink-0 whitespace-nowrap rounded-full lg:rounded-none',
                  active
                    ? `${ACCENT} font-bold`
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                )}
              >
                <Icon
                  size={16}
                  className={clsx(
                    'md:w-[18px] md:h-[18px] lg:w-5 lg:h-5',
                    active ? ACCENT_ICON : 'text-gray-400'
                  )}
                />
                <span className={clsx('text-[13px] md:text-sm lg:text-base font-medium', active && 'font-bold')}>
                  {item.label}
                </span>
                {active && <ChevronRight size={16} className="ml-auto text-brand hidden lg:block" />}
              </Link>
            );
          })}
        </div>

        {/* Logout Button — Desktop */}
        <button
          type="button"
          onClick={handleLogout}
          className="hidden lg:flex w-full items-center gap-4 px-6 py-4 cursor-pointer text-gray-600 hover:bg-red-50 hover:text-red-600 border-t border-gray-100 transition-colors text-left"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Logout — Mobile (below the scrollable pills) */}
      <button
        type="button"
        onClick={handleLogout}
        className="lg:hidden w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-100 text-red-600 hover:bg-red-50 transition-colors text-[13px] font-bold cursor-pointer"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
}
