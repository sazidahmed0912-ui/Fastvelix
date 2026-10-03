'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { API_BASE } from '@/lib/env';
import {
  LayoutDashboard, Package, ShoppingBag, ArrowLeft,
  Upload, Camera, Save, Building2, MapPin, Landmark, User
} from 'lucide-react';
import { clsx } from 'clsx';

interface SellerProfile {
  _id: string;
  businessName: string;
  description: string;
  website: string;
  phone: string;
  logo: string;
  banner: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

const EMPTY_ADDRESS = { street: '', city: '', state: '', pincode: '', country: 'India' };
const EMPTY_BANK = { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' };

export default function SellerProfilePage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState(EMPTY_ADDRESS);
  const [bankDetails, setBankDetails] = useState(EMPTY_BANK);

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; seller: SellerProfile }>('/seller/profile');
        if (data.success && data.seller) {
          setProfile(data.seller);
          setBusinessName(data.seller.businessName || '');
          setDescription(data.seller.description || '');
          setWebsite(data.seller.website || '');
          setPhone(data.seller.phone || '');
          setPickupAddress(data.seller.pickupAddress || EMPTY_ADDRESS);
          setBankDetails(data.seller.bankDetails || EMPTY_BANK);
          setLogoPreview(data.seller.logo || '');
          setBannerPreview(data.seller.banner || '');
        }
      } catch (err) {
        console.error('Failed to load seller profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleFileChange = (type: 'logo' | 'banner', file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'logo') { setLogoFile(file); setLogoPreview(url); }
    else { setBannerFile(file); setBannerPreview(url); }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('businessName', businessName);
      formData.append('description', description);
      formData.append('website', website);
      formData.append('phone', phone);
      formData.append('pickupAddress', JSON.stringify(pickupAddress));
      formData.append('bankDetails', JSON.stringify(bankDetails));
      if (logoFile) formData.append('logo', logoFile);
      if (bannerFile) formData.append('banner', bannerFile);

      const res = await fetch(`${API_BASE}/seller/profile`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Profile saved successfully.');
        setLogoFile(null);
        setBannerFile(null);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <div className="mb-6">
          <Link href="/seller" className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-dark">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-neutral-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Store Profile</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage your business identity, logistics, and payout details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="border-r border-neutral-100 pr-0 lg:pr-6 space-y-1">
            <Link href="/seller" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link href="/seller/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Package size={16} /> Products
            </Link>
            <Link href="/seller/orders" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingBag size={16} /> Orders
            </Link>
            <Link href="/seller/profile" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
              <User size={16} /> Store Profile
            </Link>
          </aside>

          {/* Main */}
          <div className="lg:col-span-3 space-y-8">
            {loading ? (
              <p className="text-sm text-neutral-400 animate-pulse">Loading profile...</p>
            ) : (
              <>
                {/* Success Banner */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-3">{success}</div>
                )}

                {/* Banner Upload */}
                <section className="border border-neutral-200 bg-white shadow-sm overflow-hidden">
                  <div
                    className="relative h-40 md:h-52 bg-neutral-100 cursor-pointer group"
                    onClick={() => bannerRef.current?.click()}
                  >
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Store banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <Camera size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider gap-2">
                      <Upload size={16} /> Change Banner
                    </div>
                    <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange('banner', e.target.files?.[0] || null)} />
                  </div>
                  {/* Logo Overlay */}
                  <div className="px-6 pb-6 -mt-12 relative z-10 flex items-end gap-4">
                    <div
                      className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden cursor-pointer group relative flex-shrink-0"
                      onClick={() => logoRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-300">
                          <Building2 size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                        <Camera size={16} className="text-white" />
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)} />
                    </div>
                    <div className="pb-1">
                      <p className="text-lg font-bold">{businessName || 'Your Store Name'}</p>
                      <p className="text-xs text-neutral-400">Click logo or banner to upload</p>
                    </div>
                  </div>
                </section>

                {/* Business Info */}
                <section className="border border-neutral-200 bg-white shadow-sm p-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Building2 size={16} /> Business Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Business Name</label>
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Phone</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Website</label>
                      <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Store Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-dark resize-none" />
                    </div>
                  </div>
                </section>

                {/* Pickup Address */}
                <section className="border border-neutral-200 bg-white shadow-sm p-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin size={16} /> Pickup Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Street Address</label>
                      <input type="text" value={pickupAddress.street} onChange={(e) => setPickupAddress(p => ({ ...p, street: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">City</label>
                      <input type="text" value={pickupAddress.city} onChange={(e) => setPickupAddress(p => ({ ...p, city: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">State</label>
                      <input type="text" value={pickupAddress.state} onChange={(e) => setPickupAddress(p => ({ ...p, state: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">PIN Code</label>
                      <input type="text" value={pickupAddress.pincode} onChange={(e) => setPickupAddress(p => ({ ...p, pincode: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Country</label>
                      <input type="text" value={pickupAddress.country} onChange={(e) => setPickupAddress(p => ({ ...p, country: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                  </div>
                </section>

                {/* Bank Details */}
                <section className="border border-neutral-200 bg-white shadow-sm p-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Landmark size={16} /> Bank / Payout Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Account Holder Name</label>
                      <input type="text" value={bankDetails.accountHolderName} onChange={(e) => setBankDetails(b => ({ ...b, accountHolderName: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Bank Name</label>
                      <input type="text" value={bankDetails.bankName} onChange={(e) => setBankDetails(b => ({ ...b, bankName: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Account Number</label>
                      <input type="text" value={bankDetails.accountNumber} onChange={(e) => setBankDetails(b => ({ ...b, accountNumber: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">IFSC Code</label>
                      <input type="text" value={bankDetails.ifscCode} onChange={(e) => setBankDetails(b => ({ ...b, ifscCode: e.target.value }))} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                    </div>
                  </div>
                </section>

                {/* Save */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={clsx(
                      "h-11 px-8 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 transition-colors",
                      saving ? "bg-neutral-300 text-neutral-500" : "bg-dark text-white hover:bg-neutral-800"
                    )}
                  >
                    <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
