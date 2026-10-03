'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import {
  LayoutDashboard, Store, ShoppingBag, Undo2, History, ArrowLeft,
  Plus, Trash2, GripVertical, Save, Image, Calendar, Eye, EyeOff
} from 'lucide-react';
import { clsx } from 'clsx';

type SectionType = 'HERO_BANNER' | 'FEATURED_PRODUCTS' | 'CATEGORY_STRIP' | 'PROMO_BANNER';

interface HomepageSection {
  _id?: string;
  sectionKey: string;
  title: string;
  sectionType: SectionType;
  topLevelCategory: 'ALL' | 'FASHION' | 'CAKES_AND_BAKES';
  isActive: boolean;
  sortOrder: number;
  startDate: string;
  endDate: string;
  content: {
    imageUrl?: string;
    linkUrl?: string;
    heading?: string;
    subheading?: string;
    productIds?: string[];
    categoryIds?: string[];
  };
}

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: 'HERO_BANNER', label: 'Hero Banner' },
  { value: 'FEATURED_PRODUCTS', label: 'Featured Products' },
  { value: 'CATEGORY_STRIP', label: 'Category Strip' },
  { value: 'PROMO_BANNER', label: 'Promo Banner' },
];

const emptySection = (): HomepageSection => ({
  sectionKey: `section_${Date.now()}`,
  title: '',
  sectionType: 'HERO_BANNER',
  topLevelCategory: 'ALL',
  isActive: true,
  sortOrder: 0,
  startDate: '',
  endDate: '',
  content: { imageUrl: '', linkUrl: '', heading: '', subheading: '', productIds: [], categoryIds: [] },
});

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; sections: HomepageSection[] }>('/admin/homepage-sections');
        if (data.success) {
          setSections(data.sections);
        }
      } catch (err) {
        console.error('Failed to load homepage sections:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const addSection = () => {
    const s = emptySection();
    s.sortOrder = sections.length;
    setSections([...sections, s]);
    setExpandedIdx(sections.length);
  };

  const removeSection = (idx: number) => {
    const next = [...sections];
    next.splice(idx, 1);
    setSections(next);
  };

  const updateSection = (idx: number, patch: Partial<HomepageSection>) => {
    const next = [...sections];
    next[idx] = { ...next[idx], ...patch };
    setSections(next);
  };

  const updateContent = (idx: number, patch: Partial<HomepageSection['content']>) => {
    const next = [...sections];
    next[idx] = { ...next[idx], content: { ...next[idx].content, ...patch } };
    setSections(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    try {
      await api.put('/admin/homepage-sections', { sections });
      setSuccess('Homepage layout saved successfully.');
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
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-dark">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-neutral-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Homepage CMS</h1>
            <p className="text-sm text-neutral-500 mt-1">Configure hero banners, featured sections, and promotional layouts.</p>
          </div>
          <button onClick={addSection} className="h-10 px-5 bg-dark text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:bg-neutral-800 transition-colors">
            <Plus size={14} /> Add Section
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="border-r border-neutral-100 pr-0 lg:pr-6 space-y-1">
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <LayoutDashboard size={16} /> Overview
            </Link>
            <Link href="/admin/sellers" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Store size={16} /> Seller Applications
            </Link>
            <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingBag size={16} /> Product Approvals
            </Link>
            <Link href="/admin/refunds" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Undo2 size={16} /> Refund Requests
            </Link>
            <Link href="/admin/homepage" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
              <Image size={16} /> Homepage CMS
            </Link>
            <Link href="/admin/audit-logs" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <History size={16} /> System Audit Logs
            </Link>
          </aside>

          {/* Main */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <p className="text-sm text-neutral-400 animate-pulse">Loading sections...</p>
            ) : (
              <>
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-3 mb-4">{success}</div>
                )}

                {sections.length === 0 && (
                  <div className="text-center py-16 bg-white border border-neutral-200">
                    <Image size={48} className="mx-auto text-neutral-200 mb-4" />
                    <p className="text-sm text-neutral-500">No homepage sections configured yet.</p>
                    <button onClick={addSection} className="mt-4 h-9 px-4 bg-dark text-white text-xs font-bold uppercase tracking-wider cursor-pointer">
                      <Plus size={12} className="inline mr-1" /> Create First Section
                    </button>
                  </div>
                )}

                {sections.map((section, idx) => {
                  const isExpanded = expandedIdx === idx;
                  return (
                    <div key={section.sectionKey} className="border border-neutral-200 bg-white shadow-sm">
                      {/* Collapsed Header */}
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical size={14} className="text-neutral-300" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 bg-neutral-100 px-2 py-0.5">
                            {(section?.sectionType || 'HERO_BANNER').replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-bold">{section?.title || 'Untitled Section'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {section?.isActive ? <Eye size={14} className="text-green-500" /> : <EyeOff size={14} className="text-neutral-300" />}
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">{section?.topLevelCategory || 'ALL'}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                            className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Editor */}
                      {isExpanded && (
                        <div className="border-t border-neutral-100 px-4 py-5 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Section Title</label>
                              <input type="text" value={section.title} onChange={(e) => updateSection(idx, { title: e.target.value })} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Section Type</label>
                              <select value={section.sectionType} onChange={(e) => updateSection(idx, { sectionType: e.target.value as SectionType })} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark bg-white">
                                {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Audience</label>
                              <select value={section.topLevelCategory} onChange={(e) => updateSection(idx, { topLevelCategory: e.target.value as 'ALL' | 'FASHION' | 'CAKES_AND_BAKES' })} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark bg-white">
                                <option value="ALL">All (Both)</option>
                                <option value="FASHION">Fashion Only</option>
                                <option value="CAKES_AND_BAKES">Cakes &amp; Bakes Only</option>
                              </select>
                            </div>
                          </div>

                          {/* Content Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Heading Text</label>
                              <input type="text" value={section.content.heading || ''} onChange={(e) => updateContent(idx, { heading: e.target.value })} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Subheading</label>
                              <input type="text" value={section.content.subheading || ''} onChange={(e) => updateContent(idx, { subheading: e.target.value })} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Image URL</label>
                              <input type="url" value={section.content.imageUrl || ''} onChange={(e) => updateContent(idx, { imageUrl: e.target.value })} placeholder="https://..." className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Link URL</label>
                              <input type="url" value={section.content.linkUrl || ''} onChange={(e) => updateContent(idx, { linkUrl: e.target.value })} placeholder="/fashion or https://..." className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                            </div>
                          </div>

                          {/* Scheduling */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Start Date</label>
                              <input type="datetime-local" value={section.startDate ? section.startDate.slice(0, 16) : ''} onChange={(e) => updateSection(idx, { startDate: e.target.value })} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">End Date</label>
                              <input type="datetime-local" value={section.endDate ? section.endDate.slice(0, 16) : ''} onChange={(e) => updateSection(idx, { endDate: e.target.value })} className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                            </div>
                            <div className="flex items-end gap-4">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-neutral-600 h-10">
                                <input type="checkbox" checked={section.isActive} onChange={(e) => updateSection(idx, { isActive: e.target.checked })} className="accent-dark" />
                                Active
                              </label>
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Order</label>
                                <input type="number" min={0} value={section.sortOrder} onChange={(e) => updateSection(idx, { sortOrder: parseInt(e.target.value) || 0 })} className="w-20 h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark" />
                              </div>
                            </div>
                          </div>

                          {/* Product IDs for Featured */}
                          {section.sectionType === 'FEATURED_PRODUCTS' && (
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Product IDs (comma-separated)</label>
                              <input
                                type="text"
                                value={(section.content.productIds || []).join(', ')}
                                onChange={(e) => updateContent(idx, { productIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                placeholder="60a1b2c3..., 60d4e5f6..."
                                className="w-full h-10 border border-neutral-200 px-3 text-sm focus:outline-none focus:border-dark"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Save All */}
                {sections.length > 0 && (
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={clsx(
                        "h-11 px-8 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 transition-colors",
                        saving ? "bg-neutral-300 text-neutral-500" : "bg-dark text-white hover:bg-neutral-800"
                      )}
                    >
                      <Save size={14} /> {saving ? 'Publishing...' : 'Publish Layout'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
