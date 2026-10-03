'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { ShieldCheck, ShieldAlert, ArrowRight, Store } from 'lucide-react';
import { clsx } from 'clsx';

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user } = useStore();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('INDIVIDUAL');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [requestedCategories, setRequestedCategories] = useState<string[]>(['FASHION']);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setContactName(user.name);
      setContactEmail(user.email);
    }
  }, [user]);

  const handleCategoryToggle = (cat: string) => {
    setRequestedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      router.push('/login?redirect=/become-seller');
      return;
    }

    if (requestedCategories.length === 0) {
      setError('Please select at least one top-level category.');
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError('Pincode must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post<{ success: boolean; message?: string }>('/seller-application/apply', {
        businessName,
        businessType,
        gstin: gstin || undefined,
        pan: pan || undefined,
        contactName,
        contactEmail,
        contactPhone,
        businessAddress: {
          addressLine1,
          city,
          state,
          pincode,
        },
        requestedCategories,
      });

      if (data.success) {
        setSuccess('Application submitted! Admins will review your details.');
        setTimeout(() => {
          router.push('/account');
        }, 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed. You may have already applied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <div className="bg-white border border-neutral-200 p-8 shadow-sm-custom">
          
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="p-3 bg-brand-light text-brand rounded-full mb-3">
              <Store size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Become a FastVelix Partner</h1>
            <p className="text-sm text-neutral-500 mt-1">
              List and fulfill your products directly to millions of customers.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs flex items-start gap-2">
              <ShieldAlert className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs flex items-start gap-2">
              <ShieldCheck className="shrink-0 mt-0.5" size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Business Profile */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100">
                1. Business Identity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Registered Business Name</label>
                  <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. TrendHub Retailers" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Business Entity Type</label>
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm bg-white">
                    <option value="INDIVIDUAL">Individual / Sole Proprietor</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="PRIVATE_LIMITED">Private Limited Company</option>
                    <option value="LLP">Limited Liability Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">GSTIN Number (Optional)</label>
                  <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">PAN Number (Optional)</label>
                  <input type="text" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100">
                2. Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Representative Name</label>
                  <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Representative Phone</label>
                  <input type="tel" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={10} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Business Email Address</label>
                  <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
              </div>
            </div>

            {/* Section 3: Pickup Location */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100">
                3. Pickup Address
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Warehouse / Pickup Address Line 1</label>
                  <input type="text" required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">City</label>
                  <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">State</label>
                  <input type="text" required value={state} onChange={(e) => setState(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Pincode</label>
                  <input type="text" required value={pincode} maxLength={6} onChange={(e) => setPincode(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                </div>
              </div>
            </div>

            {/* Section 4: Vertical Catalog Selection */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100">
                4. Commerce Categories
              </h3>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-neutral-600">
                  <input
                    type="checkbox"
                    checked={requestedCategories.includes('FASHION')}
                    onChange={() => handleCategoryToggle('FASHION')}
                    className="accent-dark h-4 w-4"
                  />
                  <span>Fashion Apparel / Shoes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-neutral-600">
                  <input
                    type="checkbox"
                    checked={requestedCategories.includes('CAKES_AND_BAKES')}
                    onChange={() => handleCategoryToggle('CAKES_AND_BAKES')}
                    className="accent-emerald-800 h-4 w-4"
                  />
                  <span>Cakes &amp; Bakes / Custom Bakery</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-dark hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting details...' : 'Submit Application'}
              {!loading && <ArrowRight size={16} />}
            </button>

          </form>

        </div>
      </main>
      <Footer />
    </>
  );
}
