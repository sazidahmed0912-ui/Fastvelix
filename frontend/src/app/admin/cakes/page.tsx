'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { Cake, Sparkles, Plus, Trash2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function AdminCakesManagementPage() {
  const { user } = useStore();
  const [options, setOptions] = useState<any>({
    sizes: [],
    flavours: [],
    styles: [],
    toppers: [],
    decorations: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sizes' | 'flavours' | 'styles' | 'toppers'>('flavours');
  
  const [newOption, setNewOption] = useState({
    name: '',
    extraPrice: 0,
    servings: '',
    weightKg: 0.5,
    category: 'BIRTHDAY',
    image: '',
  });

  const loadOptions = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; options: any }>('/cake-options');
      if (data.success) {
        setOptions(data.options);
      }
    } catch (err) {
      console.error('Error loading cake options:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption.name) return;

    try {
      let endpoint = `/cake-options/${activeTab}`;
      let body: any = {
        name: newOption.name,
        extraPrice: Number(newOption.extraPrice),
        isActive: true,
      };

      if (activeTab === 'sizes') {
        body.servings = newOption.servings || '4-6 Servings';
        body.weightKg = Number(newOption.weightKg);
      } else if (activeTab === 'styles') {
        body.category = newOption.category;
        body.image = newOption.image;
      } else if (activeTab === 'flavours') {
        body.image = newOption.image;
      }

      const res = await api.post<{ success: boolean }>(endpoint, body);
      if (res.success) {
        alert(`${activeTab.slice(0, -1)} added successfully!`);
        setNewOption({ name: '', extraPrice: 0, servings: '', weightKg: 0.5, category: 'BIRTHDAY', image: '' });
        loadOptions();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add option');
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <div className="max-w-7xl mx-auto p-12 text-center text-red-600 font-bold">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 w-full">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-black mb-1">
              <ArrowLeft size={12} /> Back to Dashboard
            </Link>
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              <Cake size={20} className="text-amber-600" />
              <span>Cakes &amp; Bakes Customization Studio Management</span>
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 gap-2 mb-6">
          {(['flavours', 'sizes', 'styles', 'toppers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              {tab} ({options[tab]?.length || 0})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Option Form */}
          <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm h-fit">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-stone-400 mb-3 pb-2 border-b">
              Add New {activeTab.slice(0, -1)}
            </h3>

            <form onSubmit={handleAddOption} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newOption.name}
                  onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                  placeholder={`e.g. ${activeTab === 'flavours' ? 'Belgian Chocolate' : activeTab === 'sizes' ? '1.5 kg' : 'Royal Gold'}`}
                  className="w-full h-8 px-3 border border-stone-200 rounded focus:outline-none focus:border-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Additional Price (₹)</label>
                <input
                  type="number"
                  value={newOption.extraPrice}
                  onChange={(e) => setNewOption({ ...newOption, extraPrice: Number(e.target.value) })}
                  className="w-full h-8 px-3 border border-stone-200 rounded focus:outline-none focus:border-stone-900"
                />
              </div>

              {activeTab === 'sizes' && (
                <>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newOption.weightKg}
                      onChange={(e) => setNewOption({ ...newOption, weightKg: Number(e.target.value) })}
                      className="w-full h-8 px-3 border border-stone-200 rounded focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Servings Info</label>
                    <input
                      type="text"
                      placeholder="e.g. 8-10 Servings"
                      value={newOption.servings}
                      onChange={(e) => setNewOption({ ...newOption, servings: e.target.value })}
                      className="w-full h-8 px-3 border border-stone-200 rounded focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </>
              )}

              {(activeTab === 'flavours' || activeTab === 'styles') && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newOption.image}
                    onChange={(e) => setNewOption({ ...newOption, image: e.target.value })}
                    className="w-full h-8 px-3 border border-stone-200 rounded focus:outline-none focus:border-stone-900"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full h-9 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus size={14} />
                <span>Save Option</span>
              </button>
            </form>
          </div>

          {/* Existing Options List */}
          <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-stone-400 mb-3 pb-2 border-b">
              Configured {activeTab} in Database
            </h3>

            {loading ? (
              <p className="text-xs text-stone-400 py-6 text-center">Loading database options...</p>
            ) : options[activeTab]?.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No options found for {activeTab}. Add one above.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options[activeTab].map((item: any) => (
                  <div key={item._id} className="p-3 border border-stone-200 rounded-lg flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded border" />
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-stone-900">{item.name}</h4>
                        <span className="text-[10px] text-stone-500">
                          {item.extraPrice > 0 ? `+ ₹${item.extraPrice}` : 'Included Base'}
                          {item.servings ? ` • ${item.servings}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} /> Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
