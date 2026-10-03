'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/utils/api';
import { ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', {
        email,
      });
      if (data.success) {
        setSuccess(data.message || 'If an account exists with this email, you will receive a password reset link.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4 bg-neutral-50">
        <div className="max-w-md w-full bg-white border border-neutral-200 p-8 shadow-sm-custom">
          
          <div className="mb-6">
            <Link href="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-dark">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Forgot Password</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Enter your email and we'll send you instructions to reset your password.
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

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-dark hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-wider transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
