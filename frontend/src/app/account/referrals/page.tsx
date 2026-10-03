'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { api } from '@/utils/api';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Award,
  Sparkles,
  ChevronLeft,
  MessageCircle,
  Send,
  ExternalLink,
  ShieldCheck,
  Tag,
} from 'lucide-react';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    totalReferred: number;
    totalEarned: number;
    pendingRewards: number;
  };
  program: {
    referrerReward: { type: string; value: number; minOrderValue: number };
    refereeReward: { type: string; value: number; minOrderValue: number };
  };
}

export default function ReferralsPage() {
  const { user } = useStore();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: ReferralData }>('/referrals/my-profile');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Referral load error:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      loadProfile();
    }
  }, [user]);

  const referralCode = data?.referralCode || 'FASTVELIX100';
  const referralLink =
    data?.referralLink ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/signup?ref=${referralCode}`
      : `https://fastvelix.com/signup?ref=${referralCode}`);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareText = `Hey! Order premium custom cakes, bakes, and fashion apparel on FastVelix. Use my code ${referralCode} to get ₹100 instant discount on your first order! ${referralLink}`;

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTelegramShare = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
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
          <span className="text-xs text-neutral-500">FastVelix Referral Club</span>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-purple-950 text-white p-6 sm:p-10 shadow-xl mb-8">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold tracking-wide">
              <Gift size={14} /> Refer Friends & Earn Wallet Credits
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Give ₹100, Get ₹100 for every friend who orders!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Invite your friends and family to shop handcrafted cakes and the latest fashion trends. When they make their first purchase, you both receive ₹100 in your FastVelix Wallet.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="relative z-10 grid grid-cols-3 gap-3 mt-8 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Total Earned</p>
              <p className="text-xl font-bold text-emerald-400">₹{data?.stats?.totalEarned || 0}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Friends Joined</p>
              <p className="text-xl font-bold text-purple-400">{data?.stats?.totalReferred || 0}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Pending Rewards</p>
              <p className="text-xl font-bold text-amber-400">₹{data?.stats?.pendingRewards || 0}</p>
            </div>
          </div>

          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Referral Sharing Box */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-6">
            Share Your Unique Invitation Code
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code Box */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">
                Your Referral Code
              </label>
              <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                <span className="font-mono text-base font-bold text-neutral-900 px-3 flex-1 tracking-wider">
                  {referralCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-md bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                >
                  {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* Link Box */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">
                Your Direct Referral Link
              </label>
              <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="bg-transparent text-xs text-neutral-600 px-2 flex-1 focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide mr-2">Quick Share via:</span>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button
              type="button"
              onClick={handleTelegramShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition-colors shadow-sm"
            >
              <Send size={15} /> Telegram
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-200 transition-colors"
            >
              <Share2 size={15} /> More Channels
            </button>
          </div>
        </div>

        {/* How It Works 3-Step Process */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-6 text-center">
            How The FastVelix Referral Program Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-sm">
                1
              </div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Share Your Invite Link</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Send your unique code or link to friends, family, and colleagues via WhatsApp or Social Media.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-sm">
                2
              </div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Friend Places 1st Order</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Your friend registers with your code and gets ₹100 instant discount on their first cake or fashion order.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-sm">
                3
              </div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">You Get ₹100 in Wallet</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Once the order is successfully delivered, ₹100 is credited straight into your FastVelix Store Wallet.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
