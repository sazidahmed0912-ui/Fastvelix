'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { api } from '@/utils/api';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  ShoppingBag,
  RefreshCw,
  ShieldCheck,
  Zap,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';

interface WalletTx {
  _id: string;
  type: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const { user } = useStore();
  const [balance, setBalance] = useState(0);
  const [pendingCashback, setPendingCashback] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [topupAmount, setTopupAmount] = useState<number | ''>('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        balance: number;
        pendingCashback: number;
        referralEarnings: number;
      }>('/wallet/me');
      if (res.success) {
        setBalance(res.balance || 0);
        setPendingCashback(res.pendingCashback || 0);
        setReferralEarnings(res.referralEarnings || 0);
      }

      const txRes = await api.get<{
        success: boolean;
        transactions: WalletTx[];
      }>(`/wallet/transactions?type=${filter}`);
      if (txRes.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user, filter]);

  const handleTopup = async (amountToAdd: number) => {
    if (!amountToAdd || amountToAdd <= 0) return;
    setTopupLoading(true);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/wallet/topup', {
        amount: amountToAdd,
      });
      if (res.success) {
        setMessage({ type: 'success', text: res.message || `₹${amountToAdd} added to wallet!` });
        setTopupAmount('');
        fetchWallet();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add funds. Please try again.' });
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <div>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Account
          </Link>
          <span className="text-xs text-neutral-500">FastVelix Secure Wallet</span>
        </div>

        {/* Balance Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-emerald-950 text-white p-6 sm:p-8 shadow-xl mb-8">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-2 md:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide">
                <Wallet size={14} /> Available Store Credits
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h1>
              <p className="text-xs text-neutral-400 max-w-md">
                Use your wallet balance for instantaneous 1-click checkout on fresh cakes, bakes, and fashion apparel.
              </p>
            </div>

            {/* Sub Stats */}
            <div className="grid grid-cols-2 gap-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Cashback</p>
                <p className="text-lg font-bold text-emerald-400">₹{pendingCashback}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Referrals</p>
                <p className="text-lg font-bold text-purple-400">₹{referralEarnings}</p>
              </div>
            </div>
          </div>

          {/* Decorative Sparkles */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Quick Top-Up Bar */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle size={18} className="text-emerald-700" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Add Money to Wallet</h2>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs font-semibold ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {[100, 500, 1000, 2000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTopupAmount(preset)}
                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                  topupAmount === preset
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-neutral-50'
                }`}
              >
                +₹{preset}
              </button>
            ))}

            <div className="flex-1 min-w-[200px] flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">₹</span>
                <input
                  type="number"
                  placeholder="Enter custom amount"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-7 pr-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="button"
                disabled={topupLoading || !topupAmount}
                onClick={() => handleTopup(Number(topupAmount))}
                className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {topupLoading ? 'Adding...' : 'Add Funds'}
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900">Zero-Wait Checkout</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Skip bank OTP delays with 1-click wallet payments.</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900">Instant Refunds</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Cancelled orders credit back to wallet in under 5 seconds.</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900">Exclusive Cashbacks</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Earn reward bonus points on festivals and referral promos.</p>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Transaction Passbook</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Complete record of your credits, debits, and promotional earnings.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg">
              {['all', 'WALLET_TOPUP', 'ORDER_WALLET_DEBIT', 'REFUND_CREDIT', 'REFERRAL_REWARD'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                    filter === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {tab === 'all'
                    ? 'All'
                    : tab === 'WALLET_TOPUP'
                    ? 'Top-ups'
                    : tab === 'ORDER_WALLET_DEBIT'
                    ? 'Orders'
                    : tab === 'REFUND_CREDIT'
                    ? 'Refunds'
                    : 'Rewards'}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400">Loading wallet ledger...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet size={32} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-xs font-bold text-neutral-600">No transactions yet</p>
              <p className="text-[11px] text-neutral-400 mt-1">Recharge your wallet or place an order to see activity here.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {transactions.map((tx) => (
                <div key={tx._id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        tx.direction === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {tx.direction === 'CREDIT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">{tx.description}</p>
                      <p className="text-[11px] text-neutral-400">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs font-extrabold ${
                        tx.direction === 'CREDIT' ? 'text-emerald-700' : 'text-neutral-900'
                      }`}
                    >
                      {tx.direction === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-neutral-400">Bal: ₹{tx.balanceAfter.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
