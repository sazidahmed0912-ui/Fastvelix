'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { api } from '@/utils/api';
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  Laptop,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  LogOut,
} from 'lucide-react';

export default function SecurityPage() {
  const { user } = useStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.put<{ success: boolean; message: string }>('/users/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setFeedback({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>

      <div className="space-y-1">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Account
          </Link>
          <span className="text-xs text-neutral-500">FastVelix Security & Privacy</span>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Account Security & Credentials</h1>
              <p className="text-xs text-neutral-500">
                Manage your password, login safeguards, and active device sessions.
              </p>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
              <KeyRound size={18} className="text-neutral-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Change Password</h2>
            </div>

            {feedback && (
              <div
                className={`mb-6 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    placeholder="Enter existing password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    placeholder="Minimum 8 alphanumeric characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>

          {/* Active Devices & Sessions */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Laptop size={18} className="text-neutral-700" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Active Sessions</h2>
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <Laptop size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-neutral-900">Current Web Session</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active Now
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">Desktop Browser • Bengaluru, India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
