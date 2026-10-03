'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api';
import { useStore, User } from '@/store/useStore';
import { ShieldAlert, ArrowRight, Eye, EyeOff, UserCheck, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, logout } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post<{ success: boolean; user: User }>('/auth/login', {
        email: email.trim(),
        password,
      });

      if (data.success) {
        setUser(data.user);

        // Dynamic redirection depending on user role
        if (data.user.role === 'SELLER') {
          router.push('/seller');
        } else if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push(redirectUrl);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4 bg-neutral-50 text-neutral-900">
        <div className="max-w-md w-full bg-white border border-neutral-200 p-8 shadow-sm">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Welcome Back</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Log in to your FastVelix customer, seller, or admin account.
            </p>
          </div>

          {/* If already logged in */}
          {user && (
            <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <UserCheck size={16} /> Currently signed in as:
              </div>
              <p className="text-neutral-700 mt-1 font-semibold truncate">{user.email} ({user.role})</p>
              <div className="mt-2.5 flex items-center gap-2">
                <Link
                  href={user.role === 'SELLER' ? '/seller' : user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '/admin' : '/account'}
                  className="px-3 py-1 bg-emerald-700 text-white font-bold rounded text-[11px] hover:bg-emerald-800 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className="px-3 py-1 bg-white border border-neutral-300 text-neutral-700 font-semibold rounded text-[11px] hover:bg-neutral-100 transition-colors"
                >
                  Logout & Switch
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs flex items-start gap-2">
              <ShieldAlert className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 border border-neutral-300 rounded focus:outline-none focus:border-emerald-600 text-xs font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-700 hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-10 pl-3 pr-10 border border-neutral-300 rounded focus:outline-none focus:border-emerald-600 text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded"
            >
              {loading ? 'Logging in...' : 'Log In'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Quick Demo Fillers */}
          <div className="mt-6 pt-5 border-t border-neutral-100">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-amber-500" /> Quick Demo Login (1-Click)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickLogin('admin@fastvelix.com', 'Admin@123')}
                className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-[11px] rounded border border-neutral-200 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin('seller@fastvelix.com', 'Seller@123')}
                className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-[11px] rounded border border-neutral-200 transition-colors"
              >
                Seller
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin('customer@fastvelix.com', 'Customer@123')}
                className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-[11px] rounded border border-neutral-200 transition-colors"
              >
                Customer
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 text-center text-xs">
            <span className="text-neutral-500">New to FastVelix? </span>
            <Link href="/signup" className="text-emerald-700 hover:underline font-bold">
              Create an Account
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center text-xs text-neutral-400">Loading Login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
