'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { clsx } from 'clsx';
import {
  ArrowLeft, ChevronRight, Save, Eye, Send, Plus, Trash2, X,
  Upload, CheckCircle2, AlertCircle, Loader2, RefreshCw, GripVertical, Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { _id: string; name: string; slug: string; subcategories: { name: string; slug: string }[] }
interface FashionVariant { id: string; sku: string; size: string; color: string; colorHex: string; stock: number; price: string; isActive: boolean }

const TABS = ['General', 'Images', 'Pricing', 'Variants', 'Attributes', 'SEO', 'Preview'] as const;
type Tab = typeof TABS[number];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
const COLORS = ['Black', 'White', 'Navy Blue', 'Olive Green', 'Red', 'Pink', 'Yellow', 'Grey', 'Beige', 'Brown'];
const GENDERS = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'];
const FIT_OPTIONS = ['Regular', 'Slim', 'Relaxed', 'Oversized', 'Skinny', 'Straight'];
const OCCASION_OPTIONS = ['Casual', 'Formal', 'Party', 'Festive', 'Sports', 'Ethnic', 'Wedding'];

function genId() { return Math.random().toString(36).slice(2, 9); }
function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ─── Image Upload Box ─────────────────────────────────────────────────────────
function ImageUploadBox({ images, onAdd, onRemove, onSetMain, mainIdx }: {
  images: string[]; onAdd: (url: string) => void;
  onRemove: (i: number) => void; onSetMain: (i: number) => void; mainIdx: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setError('');
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Only JPG, PNG or WebP allowed.'); continue; }
      if (file.size > 5 * 1024 * 1024) { setError('Max file size is 5 MB.'); continue; }
      setUploading(true);
      try {
        const fd = new FormData(); fd.append('image', file);
        const res = await api.post<{ success: boolean; url: string }>('/admin/uploads/product-image', fd);
        if (res.success) onAdd(res.url);
      } catch (e: any) { setError(e.message || 'Upload failed.'); }
      finally { setUploading(false); }
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-stone-300 hover:border-stone-500 p-10 text-center cursor-pointer transition-colors rounded-sm"
      >
        <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFiles(e.target.files)} />
        {uploading
          ? <><Loader2 size={24} className="mx-auto animate-spin text-stone-400 mb-2" /><p className="text-sm text-stone-400">Uploading...</p></>
          : <><Upload size={24} className="mx-auto text-stone-400 mb-2" /><p className="text-sm font-bold text-stone-700">Drop images or click to upload</p><p className="text-xs text-stone-400 mt-1">JPG · PNG · WebP · Max 5 MB each</p></>
        }
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {images.map((url, i) => (
            <div key={i} className={`relative group border-2 rounded-sm overflow-hidden ${i === mainIdx ? 'border-stone-900' : 'border-stone-200'}`}>
              <img src={url} alt="" className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-center">
                <button onClick={() => onSetMain(i)} className="text-[10px] font-bold bg-white text-stone-900 px-2 py-0.5 rounded cursor-pointer">Main</button>
                <button onClick={() => onRemove(i)} className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded cursor-pointer">Remove</button>
              </div>
              {i === mainIdx && <div className="absolute top-1 left-1 text-[9px] bg-stone-900 text-white px-1 font-bold rounded">MAIN</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Slug Field ────────────────────────────────────────────────────────────────
function SlugField({ value, onChange, productId }: { value: string; onChange: (v: string) => void; productId?: string }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!value) { setStatus('idle'); return; }
    clearTimeout(timer.current);
    setStatus('checking');
    timer.current = setTimeout(async () => {
      try {
        const qs = productId ? `&excludeId=${productId}` : '';
        const res = await api.get<{ available: boolean }>(`/admin/products/slug-check?slug=${value}${qs}`);
        setStatus(res.available ? 'ok' : 'taken');
      } catch { setStatus('idle'); }
    }, 500);
  }, [value, productId]);

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">URL Slug</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-400 shrink-0">fastvelix.com/fashion/</span>
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            className="w-full h-10 border border-stone-200 px-3 pr-8 text-sm focus:outline-none focus:border-stone-900 font-mono"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {status === 'checking' && <Loader2 size={14} className="animate-spin text-stone-400" />}
            {status === 'ok' && <CheckCircle2 size={14} className="text-emerald-500" />}
            {status === 'taken' && <AlertCircle size={14} className="text-red-500" />}
          </div>
        </div>
      </div>
      {status === 'taken' && <p className="text-xs text-red-500 mt-1">This slug is already taken. Please modify it.</p>}
    </div>
  );
}

// ─── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) { onChange([...tags, t]); setInput(''); }
  };
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Tags <span className="font-normal text-stone-400">(max 10)</span></label>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          className="flex-1 h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="Type tag and press Enter" />
        <button onClick={add} className="h-10 px-4 bg-stone-900 text-white text-xs font-bold cursor-pointer">Add</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 text-xs font-bold rounded">
            {t}<button onClick={() => onChange(tags.filter(x => x !== t))} className="text-stone-400 hover:text-red-500 cursor-pointer"><X size={10} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function FashionProductStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('General');
  const [productId, setProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Categories ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // ── General ─────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategorySlug, setSubcategorySlug] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [gender, setGender] = useState('UNISEX');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('DRAFT');

  // ── Images ───────────────────────────────────────────────────────────────────
  const [images, setImages] = useState<string[]>([]);
  const [mainIdx, setMainIdx] = useState(0);

  // ── Pricing ──────────────────────────────────────────────────────────────────
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [isReturnable, setIsReturnable] = useState(true);
  const [returnWindow, setReturnWindow] = useState('7');

  // ── Variants (size × color matrix) ───────────────────────────────────────────
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['Black']);
  const [customSize, setCustomSize] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [variants, setVariants] = useState<FashionVariant[]>([]);

  // ── Attributes ────────────────────────────────────────────────────────────────
  const [material, setMaterial] = useState('');
  const [fit, setFit] = useState('');
  const [pattern, setPattern] = useState('');
  const [sleeve, setSleeve] = useState('');
  const [neck, setNeck] = useState('');
  const [occasion, setOccasion] = useState<string[]>([]);
  const [season, setSeason] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('India');

  // ── SEO ───────────────────────────────────────────────────────────────────────
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [slug, setSlug] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);

  // ─── Load categories ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get<{ success: boolean; categories: Category[] }>('/admin/categories?topLevelCategory=FASHION')
      .then(d => {
        setCategories(d.categories || []);
        if (d.categories?.[0]) {
          setCategoryId(d.categories[0]._id);
          setSubcategorySlug(d.categories[0].subcategories?.[0]?.slug || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (title) setSlug(slugify(title));
  }, [title]);

  // Auto-populate SEO title
  useEffect(() => {
    if (title && !seoTitle) setSeoTitle(`${title} | FastVelix Fashion`);
  }, [title]);

  // ─── Variant matrix generation ────────────────────────────────────────────
  const regenerateMatrix = useCallback(() => {
    const newVariants: FashionVariant[] = [];
    for (const color of selectedColors) {
      for (const size of selectedSizes) {
        const existing = variants.find(v => v.size === size && v.color === color);
        newVariants.push(existing || {
          id: genId(),
          sku: `FV-${color.slice(0, 2).toUpperCase()}-${size}`,
          size, color,
          colorHex: '',
          stock: 0,
          price: salePrice || '',
          isActive: true,
        });
      }
    }
    setVariants(newVariants);
  }, [selectedSizes, selectedColors, salePrice]);

  useEffect(() => { regenerateMatrix(); }, [selectedSizes, selectedColors]);

  const updateVariant = (id: string, field: string, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  // ─── Auto-save (drafts only) ──────────────────────────────────────────────
  const triggerAutoSave = useCallback(() => {
    if (!title || !productId) return; // Only auto-save existing drafts
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doSave('DRAFT', true), 30000);
  }, [title, productId]);

  useEffect(() => { triggerAutoSave(); }, [title, brand, description, salePrice]);

  // ─── Build payload ─────────────────────────────────────────────────────────
  const buildPayload = (targetStatus: 'DRAFT' | 'ACTIVE') => ({
    title, brand, shortDescription: shortDesc, description,
    categoryId, subcategorySlug, tags, gender,
    basePrice: parseFloat(basePrice) || 0,
    salePrice: parseFloat(salePrice) || 0,
    tax: { rate: parseFloat(taxRate) || 0, inclusive: taxInclusive },
    fashionVariants: variants.map(v => ({
      sku: v.sku, size: v.size, color: v.color, colorHex: v.colorHex,
      stock: Number(v.stock), price: v.price ? parseFloat(v.price) : undefined,
      isActive: v.isActive,
    })),
    material, fit, pattern, sleeve, neck, occasion, season, careInstructions, countryOfOrigin,
    isReturnable, returnWindow: parseInt(returnWindow) || 7,
    seo: { title: seoTitle, description: seoDesc, keywords: seoKeywords },
    images,
    thumbnail: images[mainIdx] || images[0] || '',
    status: targetStatus,
  });

  // ─── Validate ─────────────────────────────────────────────────────────────
  const validate = (targetStatus: 'DRAFT' | 'ACTIVE'): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Product name is required.');
    if (!description.trim()) errs.push('Description is required.');
    if (!categoryId) errs.push('Category is required.');
    if (!subcategorySlug) errs.push('Subcategory is required.');
    if (!basePrice || parseFloat(basePrice) <= 0) errs.push('MRP must be greater than 0.');
    if (!salePrice || parseFloat(salePrice) <= 0) errs.push('Sale price must be greater than 0.');
    if (parseFloat(salePrice) > parseFloat(basePrice)) errs.push('Sale price cannot exceed MRP.');
    if (targetStatus === 'ACTIVE') {
      if (images.length === 0) errs.push('At least one product image is required before publishing.');
      if (variants.length === 0) errs.push('At least one variant (size/color) is required before publishing.');
      if (variants.every(v => v.stock === 0)) errs.push('At least one variant must have stock > 0.');
    }
    return errs;
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const doSave = async (targetStatus: 'DRAFT' | 'ACTIVE', isAutoSave = false) => {
    const errs = validate(targetStatus);
    if (errs.length > 0 && !isAutoSave) { setErrors(errs); return; }
    setErrors([]);
    if (targetStatus === 'ACTIVE') setPublishing(true); else setSaving(true);

    try {
      const payload = buildPayload(targetStatus);
      let res: any;
      if (productId) {
        res = await api.patch<{ success: boolean; product: any }>(`/admin/products/${productId}`, payload);
      } else {
        res = await api.post<{ success: boolean; product: any }>('/admin/products/fashion', payload);
        setProductId(res.product._id);
      }
      setLastSaved(new Date());
      if (targetStatus === 'ACTIVE') {
        setSuccessMsg('Product published successfully!');
        setTimeout(() => router.push('/admin/products'), 1500);
      }
    } catch (e: any) {
      setErrors([e.message || 'Save failed. Please try again.']);
    } finally {
      setSaving(false); setPublishing(false);
    }
  };

  // ─── Unsaved changes guard ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (title || images.length > 0) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [title, images]);

  const selectedCategory = categories.find(c => c._id === categoryId);
  const discount = basePrice && salePrice
    ? Math.round(((parseFloat(basePrice) - parseFloat(salePrice)) / parseFloat(basePrice)) * 100)
    : 0;

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-30 bg-white border-b border-stone-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/admin/products" className="shrink-0 text-stone-400 hover:text-stone-900 transition-colors">
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                  <span>Admin</span><ChevronRight size={10} /><span>Products</span><ChevronRight size={10} /><span className="text-stone-700">Fashion Studio</span>
                </div>
                <h1 className="text-sm font-black uppercase tracking-tight text-stone-900 truncate">
                  {title || 'New Fashion Product'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastSaved && <span className="text-[10px] text-stone-400 hidden sm:block">Saved {lastSaved.toLocaleTimeString()}</span>}
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded ${status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                {status}
              </span>
              <button onClick={() => doSave('DRAFT')} disabled={saving}
                className="h-9 px-4 border border-stone-300 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
              </button>
              <button onClick={() => doSave('ACTIVE')} disabled={publishing}
                className="h-9 px-4 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publish
              </button>
            </div>
          </div>
        </div>

        {/* ── Error/Success banner ── */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1"><AlertCircle size={13} /> Please fix these issues:</p>
            <ul className="text-xs text-red-600 space-y-0.5 ml-4 list-disc">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        {successMsg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2"><CheckCircle2 size={14} />{successMsg}</div>}

        <div className="flex gap-8">
          {/* ── Left: Tab Navigation ── */}
          <aside className="w-40 shrink-0">
            <nav className="space-y-0.5 sticky top-24">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === tab ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                  }`}>
                  {tab}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Right: Tab Content ── */}
          <div className="flex-1 min-w-0">

            {/* ══ GENERAL TAB ══ */}
            {activeTab === 'General' && (
              <div className="space-y-5">
                <SectionCard title="Product Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Field label="Product Name *">
                        <input value={title} onChange={e => setTitle(e.target.value)}
                          className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900"
                          placeholder="e.g. Classic Slim Fit Oxford Shirt" />
                      </Field>
                    </div>
                    <Field label="Brand">
                      <input value={brand} onChange={e => setBrand(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900"
                        placeholder="e.g. Levis, H&M, Zara" />
                    </Field>
                    <Field label="Gender">
                      <select value={gender} onChange={e => setGender(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900 bg-white">
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Short Description">
                        <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)}
                          rows={2} maxLength={500}
                          className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-900 resize-none"
                          placeholder="Brief product summary shown in listings (max 500 chars)" />
                        <span className="text-[10px] text-stone-400">{shortDesc.length}/500</span>
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Full Description *">
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                          rows={6}
                          className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-900 resize-none"
                          placeholder="Detailed product description for the product page..." />
                      </Field>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Category">
                  {loadingCats ? <p className="text-xs text-stone-400 animate-pulse">Loading categories...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Category *">
                        <select value={categoryId} onChange={e => {
                          setCategoryId(e.target.value);
                          const cat = categories.find(c => c._id === e.target.value);
                          setSubcategorySlug(cat?.subcategories?.[0]?.slug || '');
                        }} className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900 bg-white">
                          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Subcategory *">
                        <select value={subcategorySlug} onChange={e => setSubcategorySlug(e.target.value)}
                          className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900 bg-white">
                          {selectedCategory?.subcategories.map(s => (
                            <option key={s.slug} value={s.slug}>{s.name}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Tags & Status">
                  <div className="space-y-4">
                    <TagInput tags={tags} onChange={setTags} />
                    <Field label="Product Status">
                      <select value={status} onChange={e => setStatus(e.target.value as any)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900 bg-white max-w-xs">
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active (Published)</option>
                      </select>
                    </Field>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══ IMAGES TAB ══ */}
            {activeTab === 'Images' && (
              <SectionCard title="Product Images">
                <p className="text-xs text-stone-500 mb-4">Upload high-quality product images. The first image (or the one marked Main) is used as the thumbnail.</p>
                <ImageUploadBox images={images} onAdd={url => setImages(prev => [...prev, url])}
                  onRemove={i => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  onSetMain={setMainIdx} mainIdx={mainIdx} />
              </SectionCard>
            )}

            {/* ══ PRICING TAB ══ */}
            {activeTab === 'Pricing' && (
              <div className="space-y-5">
                <SectionCard title="Price Configuration">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="MRP (₹) *">
                      <input type="number" min="0" value={basePrice} onChange={e => setBasePrice(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="999" />
                    </Field>
                    <Field label="Sale Price (₹) *">
                      <input type="number" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="799" />
                    </Field>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Discount</label>
                      <div className="h-10 border border-stone-100 bg-stone-50 px-3 flex items-center text-sm font-mono font-bold text-emerald-600">
                        {discount > 0 ? `${discount}% OFF` : '—'}
                      </div>
                    </div>
                  </div>
                  {parseFloat(salePrice) > parseFloat(basePrice) && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle size={12} />Sale price exceeds MRP — this is invalid.</p>
                  )}
                </SectionCard>

                <SectionCard title="Tax Configuration">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="GST Rate (%)">
                      <input type="number" min="0" max="28" value={taxRate} onChange={e => setTaxRate(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="5" />
                    </Field>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Tax Inclusive?</label>
                      <div className="flex gap-4 mt-2">
                        {[true, false].map(v => (
                          <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={taxInclusive === v} onChange={() => setTaxInclusive(v)} className="cursor-pointer" />
                            {v ? 'Price includes GST' : 'GST added on checkout'}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Returns Policy">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Returnable?</label>
                      <div className="flex gap-4">
                        {[true, false].map(v => (
                          <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={isReturnable === v} onChange={() => setIsReturnable(v)} />
                            {v ? 'Yes' : 'No'}
                          </label>
                        ))}
                      </div>
                    </div>
                    {isReturnable && (
                      <Field label="Return Window (days)">
                        <input type="number" min="1" max="30" value={returnWindow} onChange={e => setReturnWindow(e.target.value)}
                          className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" />
                      </Field>
                    )}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══ VARIANTS TAB ══ */}
            {activeTab === 'Variants' && (
              <div className="space-y-5">
                <SectionCard title="Size Options">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SIZES.map(s => (
                      <button key={s} onClick={() => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        className={`px-3 py-1.5 text-xs font-bold border-2 cursor-pointer transition-colors ${selectedSizes.includes(s) ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input value={customSize} onChange={e => setCustomSize(e.target.value)} placeholder="Custom size..."
                      className="h-9 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900 w-36" />
                    <button onClick={() => { if (customSize.trim()) { setSelectedSizes(p => [...p, customSize.trim()]); setCustomSize(''); } }}
                      className="h-9 px-3 bg-stone-900 text-white text-xs font-bold cursor-pointer">+ Add</button>
                  </div>
                </SectionCard>

                <SectionCard title="Color Options">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                        className={`px-3 py-1.5 text-xs font-bold border-2 cursor-pointer transition-colors ${selectedColors.includes(c) ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input value={customColor} onChange={e => setCustomColor(e.target.value)} placeholder="Custom color..."
                      className="h-9 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900 w-36" />
                    <button onClick={() => { if (customColor.trim()) { setSelectedColors(p => [...p, customColor.trim()]); setCustomColor(''); } }}
                      className="h-9 px-3 bg-stone-900 text-white text-xs font-bold cursor-pointer">+ Add</button>
                  </div>
                </SectionCard>

                <SectionCard title={`Variant Matrix — ${variants.length} Variants`}>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-stone-500">Auto-generated from your size × color selection. Edit SKU, stock and price per variant.</p>
                    <button onClick={regenerateMatrix} className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer">
                      <RefreshCw size={12} />Regenerate
                    </button>
                  </div>
                  {variants.length === 0 ? (
                    <p className="text-xs text-stone-400 py-6 text-center">Select at least one size and one color to generate variants.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-stone-50 text-[10px] uppercase font-extrabold text-stone-400 border-b">
                          <tr>
                            <th className="p-2 w-8">On</th>
                            <th className="p-2">Color</th>
                            <th className="p-2">Size</th>
                            <th className="p-2">SKU</th>
                            <th className="p-2">Stock</th>
                            <th className="p-2">Price Override (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {variants.map(v => (
                            <tr key={v.id} className={`${!v.isActive ? 'opacity-50' : ''}`}>
                              <td className="p-2">
                                <input type="checkbox" checked={v.isActive} onChange={e => updateVariant(v.id, 'isActive', e.target.checked)} className="cursor-pointer" />
                              </td>
                              <td className="p-2 font-medium text-stone-700">{v.color}</td>
                              <td className="p-2 font-medium text-stone-700">{v.size}</td>
                              <td className="p-2">
                                <input value={v.sku} onChange={e => updateVariant(v.id, 'sku', e.target.value)}
                                  className="w-28 h-7 border border-stone-200 px-2 text-xs focus:outline-none focus:border-stone-900 font-mono uppercase" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" value={v.stock} onChange={e => updateVariant(v.id, 'stock', parseInt(e.target.value) || 0)}
                                  className="w-20 h-7 border border-stone-200 px-2 text-xs focus:outline-none focus:border-stone-900" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" value={v.price} onChange={e => updateVariant(v.id, 'price', e.target.value)}
                                  placeholder={salePrice || '—'}
                                  className="w-24 h-7 border border-stone-200 px-2 text-xs focus:outline-none focus:border-stone-900" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* ══ ATTRIBUTES TAB ══ */}
            {activeTab === 'Attributes' && (
              <SectionCard title="Fashion Attributes">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Material">
                    <input value={material} onChange={e => setMaterial(e.target.value)}
                      className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="e.g. 100% Cotton, Polyester blend" />
                  </Field>
                  <Field label="Fit">
                    <select value={fit} onChange={e => setFit(e.target.value)}
                      className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900 bg-white">
                      <option value="">Select fit</option>
                      {FIT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Pattern">
                    <input value={pattern} onChange={e => setPattern(e.target.value)}
                      className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="e.g. Solid, Striped, Checkered" />
                  </Field>
                  <Field label="Sleeve">
                    <input value={sleeve} onChange={e => setSleeve(e.target.value)}
                      className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="e.g. Full, Half, Sleeveless" />
                  </Field>
                  <Field label="Neck / Collar">
                    <input value={neck} onChange={e => setNeck(e.target.value)}
                      className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="e.g. Round Neck, V-Neck, Collar" />
                  </Field>
                  <Field label="Season">
                    <input value={season} onChange={e => setSeason(e.target.value)}
                      className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="e.g. Summer, All Season" />
                  </Field>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Occasion</label>
                    <div className="flex flex-wrap gap-2">
                      {OCCASION_OPTIONS.map(o => (
                        <button key={o} onClick={() => setOccasion(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o])}
                          className={`px-3 py-1.5 text-xs font-bold border-2 cursor-pointer transition-colors ${occasion.includes(o) ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Care Instructions">
                      <input value={careInstructions} onChange={e => setCareInstructions(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" placeholder="e.g. Machine wash cold, Do not bleach" />
                    </Field>
                  </div>
                  <Field label="Country of Origin">
                    <input value={countryOfOrigin} onChange={e => setCountryOfOrigin(e.target.value)}
                      className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900" />
                  </Field>
                </div>
              </SectionCard>
            )}

            {/* ══ SEO TAB ══ */}
            {activeTab === 'SEO' && (
              <SectionCard title="Search Engine Optimization">
                <div className="space-y-4">
                  <Field label="SEO Title">
                    <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
                      className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-stone-900"
                      placeholder="Product name | FastVelix Fashion" />
                    <p className="text-[10px] text-stone-400 mt-1">{seoTitle.length}/70 characters</p>
                  </Field>
                  <Field label="Meta Description">
                    <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={3}
                      className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-900 resize-none"
                      placeholder="Brief description for search engine results (120–160 chars recommended)" />
                    <p className="text-[10px] text-stone-400 mt-1">{seoDesc.length}/160 characters</p>
                  </Field>
                  <SlugField value={slug} onChange={setSlug} productId={productId || undefined} />
                  <TagInput tags={seoKeywords} onChange={setSeoKeywords} />
                </div>
              </SectionCard>
            )}

            {/* ══ PREVIEW TAB ══ */}
            {activeTab === 'Preview' && (
              <div className="space-y-4">
                <div className="bg-stone-50 border border-stone-200 p-4 rounded text-xs text-stone-500 flex items-center gap-2">
                  <Info size={13} />This is a preview of your product using the current form data. Nothing is saved until you click Save Draft or Publish.
                </div>
                <div className="bg-white border border-stone-200 p-6 max-w-sm">
                  {images[mainIdx]
                    ? <img src={images[mainIdx]} alt={title} className="w-full aspect-[3/4] object-cover mb-4" />
                    : <div className="w-full aspect-[3/4] bg-stone-100 flex items-center justify-center mb-4 text-stone-300 text-xs">No image</div>
                  }
                  {brand && <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-1">{brand}</p>}
                  <h2 className="font-bold text-sm text-stone-900 mb-2">{title || 'Product Name'}</h2>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base font-black text-stone-900">₹{salePrice || '—'}</span>
                    {basePrice && basePrice !== salePrice && <span className="text-sm text-stone-400 line-through">₹{basePrice}</span>}
                    {discount > 0 && <span className="text-xs font-bold text-emerald-600">{discount}% OFF</span>}
                  </div>
                  {variants.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Sizes Available</p>
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(variants.filter(v => v.isActive && v.stock > 0).map(v => v.size))].map(s => (
                          <span key={s} className="px-2 py-0.5 border border-stone-300 text-xs font-bold text-stone-700">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {shortDesc && <p className="text-xs text-stone-500 line-clamp-3">{shortDesc}</p>}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─── Helper Components ─────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-sm shadow-sm">
      <div className="px-5 py-3 border-b border-stone-100">
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
