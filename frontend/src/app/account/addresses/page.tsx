'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { api } from '@/utils/api';
import { Plus, Trash2, Home, Briefcase, MapPin, ChevronRight, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface Address {
  _id: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

function AddressesContent() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [label, setLabel] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');
  const [isDefault, setIsDefault] = useState(false);
  
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; addresses: Address[] }>('/users/addresses');
      if (data.success) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error('Failed to load user addresses:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setFormError('Pincode must be exactly 6 digits.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post<{ success: boolean; address: Address }>('/users/addresses', {
        label,
        fullName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state,
        pincode,
        isDefault,
      });

      if (data.success) {
        setShowForm(false);
        // Reset form
        setFullName('');
        setPhone('');
        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setState('');
        setPincode('');
        setIsDefault(false);
        setLabel('HOME');
        
        loadAddresses();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save address.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const data = await api.delete<{ success: boolean }>(`/users/addresses/${id}`);
      if (data.success) {
        loadAddresses();
      }
    } catch (err: any) {
      alert(err.message || 'Delete request failed.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const data = await api.put<{ success: boolean }>(`/users/addresses/${id}/default`);
      if (data.success) {
        loadAddresses();
      }
    } catch (err: any) {
      alert(err.message || 'Error toggling default status.');
    }
  };

  return (
      <div className="space-y-1">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider mb-6">
          <span>Home</span>
          <ChevronRight size={12} />
          <span>Account</span>
          <ChevronRight size={12} />
          <span className="text-dark">Addresses</span>
        </div>

        <div className="flex justify-between items-center mb-8 border-b border-neutral-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Saved Addresses</h1>
            <p className="text-sm text-neutral-500 mt-1">Configure your billing & shipping delivery drop-offs.</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="h-10 px-4 bg-dark hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus size={16} /> Add New Address
            </button>
          )}
        </div>

        {showForm && (
          <div className="max-w-2xl bg-white border border-neutral-200 p-6 mb-8 shadow-sm-custom">
            <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-400 mb-6">Address Specifications</h2>
            
            {formError && (
              <p className="p-3 bg-red-50 text-red-600 text-xs font-semibold mb-4 border-l-4 border-red-500">{formError}</p>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">10-Digit Mobile Phone</label>
                <input type="tel" required value={phone} maxLength={10} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Address Line 1 (House No, Building, Area)</label>
                <input type="text" required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Address Line 2 (Landmark, Street, Optional)</label>
                <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
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
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">6-Digit Pincode</label>
                <input type="text" required value={pincode} maxLength={6} onChange={(e) => setPincode(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
              
              {/* Type Label */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Address Type Label</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HOME', 'WORK', 'OTHER'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setLabel(lbl)}
                      className={clsx(
                        "h-10 border text-xs font-semibold cursor-pointer",
                        label === lbl ? "bg-dark border-dark text-white" : "bg-white border-neutral-200 hover:border-dark"
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Default */}
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="accent-dark h-4 w-4"
                />
                <label htmlFor="isDefault" className="text-xs font-semibold text-neutral-600 cursor-pointer">
                  Mark as Default Shipping Address
                </label>
              </div>

              {/* Controls */}
              <div className="md:col-span-2 flex gap-3 pt-4 border-t border-neutral-100">
                <button type="submit" disabled={submitting} className="h-10 px-6 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Address'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="h-10 px-6 border border-neutral-200 text-dark text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address Cards List */}
        {loading ? (
          <p className="text-sm text-neutral-400 animate-pulse">Loading address records...</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-10 bg-white border border-neutral-100">No addresses saved yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={clsx(
                  "border p-6 bg-white flex flex-col justify-between gap-4 shadow-sm-custom relative",
                  addr.isDefault ? "border-brand" : "border-neutral-200"
                )}
              >
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 bg-brand text-white text-[9px] font-extrabold uppercase px-2 py-0.5 tracking-wider flex items-center gap-1">
                    <Check size={10} /> Default
                  </span>
                )}

                <div className="space-y-2">
                  {/* Label Icon */}
                  <div className="flex items-center gap-2 text-xs font-extrabold text-neutral-400 uppercase tracking-widest">
                    {addr.label === 'HOME' && <Home size={14} />}
                    {addr.label === 'WORK' && <Briefcase size={14} />}
                    {addr.label === 'OTHER' && <MapPin size={14} />}
                    <span>{addr.label}</span>
                  </div>

                  <h3 className="font-bold text-sm text-dark">{addr.fullName}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {addr.addressLine1}
                    {addr.addressLine2 && `, ${addr.addressLine2}`}
                    <br />
                    {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                  </p>
                  <p className="text-xs font-semibold text-neutral-600">Phone: {addr.phone}</p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-xs font-bold text-brand hover:underline cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
}

export default function AddressesPage() {
  return (
    <Suspense fallback={<div className="py-12" />}>
      <AddressesContent />
    </Suspense>
  );
}
