'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api';
import { ShieldCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters long, contain an uppercase letter, and a number.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.post<{ success: boolean; message: string }>('/auth/reset-password', {
        token,
        password,
      });

      if (data.success) {
        setSuccess('Password updated successfully! Redirecting you to login...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
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
            <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Enter your new password below.
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

          {!success && token && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 capital, 1 number"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-dark hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-wider transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save Password'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
