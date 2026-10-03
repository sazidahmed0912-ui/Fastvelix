'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useStore, User } from '@/store/useStore';
import { ShieldCheck, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SignupPage() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(false);

    // Client-side quick password validation
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters long, contain an uppercase letter, and a number.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.post<{ success: boolean; message: string; user: User }>('/auth/signup', {
        name,
        email,
        phone: phone || undefined,
        password,
      });

      if (data.success) {
        setSuccess('Account created successfully! We sent you a verification email.');
        setUser(data.user);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4 bg-neutral-50">
        <div className="max-w-md w-full bg-white border border-neutral-200 p-8 shadow-sm-custom">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Join FastVelix today to shop fashion and artisanal bakery items.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-start gap-2">
              <ShieldAlert className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm flex items-start gap-2">
              <ShieldCheck className="shrink-0 mt-0.5" size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Phone Number (10-digit Indian, Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 capital letter, 1 number"
                  className="w-full h-10 pl-3 pr-10 border border-neutral-200 focus:outline-none focus:border-dark text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-dark cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-dark hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-wider transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-sm">
            <span className="text-neutral-500">Already have an account? </span>
            <Link href="/login" className="text-brand hover:underline font-semibold">
              Log In
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
