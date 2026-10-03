'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { clsx } from 'clsx';
import {
  ArrowLeft, ChevronRight, Save, Send, CheckCircle2, AlertCircle,
  Loader2, Info, X, Upload, Plus, Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { _id: string; name: string; slug: string; subcategories: { name: string; slug: string }[] }
interface BakeryVariant { id: string; sku: string; size: string; weight: string; flavour: string; isEggless: boolean; unit: string; stock: number; price: string }
interface CakeSize { _id: string; name: string; weightKg: number; servings: string; extraPrice: number }
interface CakeFlavour { _id: string; name: string; extraPrice: number; description?: string }
interface CakeStyle { _id: string; name: string; category: string; extraPrice: number }

const TABS = ['General', 'Images', 'Product Type', 'Cake Options', 'Customization', 'Pricing', 'Delivery', 'Ingredients', 'SEO', 'Preview'] as const;
type Tab = typeof TABS[number];

const PRODUCT_TYPES = [
  { value: 'STANDARD_BAKERY', label: 'Standard Bakery Product', desc: 'Cupcakes, cookies, brownies, pastries, donuts' },
  { value: 'STANDARD_CAKE', label: 'Standard Cake', desc: 'Chocolate cake, red velvet, black forest' },
  { value: 'CUSTOM_CAKE', label: 'Custom Cake', desc: 'Customer-configurable cake with options' },
  { value: 'COMBO', label: 'Celebration Combo', desc: 'Cake with flowers, gifts, etc.' },
  { value: 'GIFT_BOX', label: 'Dessert Box', desc: 'Multiple bakery items packaged together' },
];

const ALLERGENS_LIST = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Wheat', 'Tree Nuts'];

function genId() { return Math.random().toString(36).slice(2, 9); }
function slugify(str: string) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

// ─── Shared Components ─────────────────────────────────────────────────────────
function SectionCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`border rounded-sm shadow-sm ${accent ? 'border-amber-200 bg-amber-50/30' : 'border-stone-200 bg-white'}`}>
      <div className={`px-5 py-3 border-b ${accent ? 'border-amber-200' : 'border-stone-100'}`}>
        <h3 className={`text-[11px] font-extrabold uppercase tracking-widest ${accent ? 'text-amber-700' : 'text-stone-500'}`}>{title}</h3>
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

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 15) { onChange([...tags, t]); setInput(''); }
  };
  return (
    <div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          className="flex-1 h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600" placeholder={placeholder || 'Type and press Enter'} />
        <button onClick={add} className="h-10 px-4 bg-amber-800 text-white text-xs font-bold cursor-pointer">Add</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 rounded">
            {t}<button onClick={() => onChange(tags.filter(x => x !== t))} className="text-amber-400 hover:text-red-500 cursor-pointer"><X size={10} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

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
        className="border-2 border-dashed border-amber-200 hover:border-amber-500 p-10 text-center cursor-pointer transition-colors bg-amber-50/30 rounded-sm"
      >
        <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFiles(e.target.files)} />
        {uploading
          ? <><Loader2 size={24} className="mx-auto animate-spin text-amber-500 mb-2" /><p className="text-sm text-amber-600">Uploading...</p></>
          : <><Upload size={24} className="mx-auto text-amber-400 mb-2" /><p className="text-sm font-bold text-amber-800">Drop cake images or click to upload</p><p className="text-xs text-amber-500 mt-1">JPG · PNG · WebP · Max 5 MB each</p></>
        }
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {images.map((url, i) => (
            <div key={i} className={`relative group border-2 rounded-sm overflow-hidden ${i === mainIdx ? 'border-amber-600' : 'border-stone-200'}`}>
              <img src={url} alt="" className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-center">
                <button onClick={() => onSetMain(i)} className="text-[10px] font-bold bg-white text-amber-800 px-2 py-0.5 rounded cursor-pointer">Main</button>
                <button onClick={() => onRemove(i)} className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded cursor-pointer">Remove</button>
              </div>
              {i === mainIdx && <div className="absolute top-1 left-1 text-[9px] bg-amber-700 text-white px-1 font-bold rounded">MAIN</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
        <span className="text-xs text-stone-400 shrink-0">fastvelix.com/cakes-and-bakes/</span>
        <div className="relative flex-1">
          <input type="text" value={value} onChange={e => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            className="w-full h-10 border border-stone-200 px-3 pr-8 text-sm focus:outline-none focus:border-amber-600 font-mono" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {status === 'checking' && <Loader2 size={14} className="animate-spin text-stone-400" />}
            {status === 'ok' && <CheckCircle2 size={14} className="text-emerald-500" />}
            {status === 'taken' && <AlertCircle size={14} className="text-red-500" />}
          </div>
        </div>
      </div>
      {status === 'taken' && <p className="text-xs text-red-500 mt-1">Slug already taken — please modify it.</p>}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function CakesBakesProductStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('General');
  const [productId, setProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Categories ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [cakeSizes, setCakeSizes] = useState<CakeSize[]>([]);
  const [cakeFlavours, setCakeFlavours] = useState<CakeFlavour[]>([]);
  const [cakeStyles, setCakeStyles] = useState<CakeStyle[]>([]);

  // ── General ─────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategorySlug, setSubcategorySlug] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('DRAFT');

  // ── Images ───────────────────────────────────────────────────────────────────
  const [images, setImages] = useState<string[]>([]);
  const [mainIdx, setMainIdx] = useState(0);

  // ── Product Type ─────────────────────────────────────────────────────────────
  const [productType, setProductType] = useState('STANDARD_CAKE');

  // ── Cake Options ─────────────────────────────────────────────────────────────
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFlavours, setSelectedFlavours] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [bakeryVariants, setBakeryVariants] = useState<BakeryVariant[]>([]);

  // ── Customization ─────────────────────────────────────────────────────────────
  const [enableSize, setEnableSize] = useState(true);
  const [enableFlavour, setEnableFlavour] = useState(true);
  const [enableColour, setEnableColour] = useState(false);
  const [enableMessage, setEnableMessage] = useState(true);
  const [enablePhoto, setEnablePhoto] = useState(false);
  const [enableTopper, setEnableTopper] = useState(false);
  const [enableDecoration, setEnableDecoration] = useState(false);
  const [enableNotes, setEnableNotes] = useState(true);

  // ── Pricing ──────────────────────────────────────────────────────────────────
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [taxRate, setTaxRate] = useState('5');

  // ── Delivery ──────────────────────────────────────────────────────────────────
  const [preparationHours, setPreparationHours] = useState('24');
  const [sameDayAvailable, setSameDayAvailable] = useState(false);
  const [advanceNoticeHours, setAdvanceNoticeHours] = useState('24');
  const [serviceablePincodes, setServiceablePincodes] = useState('');
  const [availabilityType, setAvailabilityType] = useState('MADE_TO_ORDER');

  // ── Ingredients ───────────────────────────────────────────────────────────────
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [isEggless, setIsEggless] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(true);
  const [storageInstructions, setStorageInstructions] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState('3');

  // ── SEO ───────────────────────────────────────────────────────────────────────
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [slug, setSlug] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get<{ success: boolean; categories: Category[] }>('/admin/categories?topLevelCategory=CAKES_AND_BAKES'),
      api.get<{ success: boolean; options: { sizes: CakeSize[]; flavours: CakeFlavour[]; styles: CakeStyle[] } }>('/cake-options'),
    ]).then(([catData, optData]) => {
      setCategories(catData.categories || []);
      if (catData.categories?.[0]) {
        setCategoryId(catData.categories[0]._id);
        setSubcategorySlug(catData.categories[0].subcategories?.[0]?.slug || '');
      }
      setCakeSizes(optData.options?.sizes || []);
      setCakeFlavours(optData.options?.flavours || []);
      setCakeStyles(optData.options?.styles || []);
    }).catch(console.error).finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => { if (title) setSlug(slugify(title)); }, [title]);
  useEffect(() => { if (title && !seoTitle) setSeoTitle(`${title} | FastVelix Cakes & Bakes`); }, [title]);

  // ─── Bakery Variant helpers ────────────────────────────────────────────────
  const addVariant = () => setBakeryVariants(p => [...p, { id: genId(), sku: '', size: '', weight: '', flavour: '', isEggless: false, unit: 'piece', stock: 0, price: '' }]);
  const removeVariant = (id: string) => setBakeryVariants(p => p.filter(v => v.id !== id));
  const updateVariant = (id: string, field: string, value: any) => setBakeryVariants(p => p.map(v => v.id === id ? { ...v, [field]: value } : v));

  // ─── Validate ─────────────────────────────────────────────────────────────
  const validate = (targetStatus: 'DRAFT' | 'ACTIVE'): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Product name is required.');
    if (!description.trim()) errs.push('Description is required.');
    if (!categoryId) errs.push('Category is required.');
    if (!subcategorySlug) errs.push('Subcategory is required.');
    if (!productType) errs.push('Product type is required.');
    if (!basePrice || parseFloat(basePrice) <= 0) errs.push('MRP must be greater than 0.');
    if (!salePrice || parseFloat(salePrice) <= 0) errs.push('Sale price must be greater than 0.');
    if (parseFloat(salePrice) > parseFloat(basePrice)) errs.push('Sale price cannot exceed MRP.');
    if (targetStatus === 'ACTIVE') {
      if (images.length === 0) errs.push('At least one product image is required before publishing.');
      if (productType === 'CUSTOM_CAKE' && !preparationHours) errs.push('Preparation time is required for custom cakes.');
    }
    return errs;
  };

  // ─── Save/Publish ─────────────────────────────────────────────────────────
  const doSave = async (targetStatus: 'DRAFT' | 'ACTIVE') => {
    const errs = validate(targetStatus);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    if (targetStatus === 'ACTIVE') setPublishing(true); else setSaving(true);

    try {
      const payload = {
        title, brand, shortDescription: shortDesc, description,
        categoryId, subcategorySlug, tags,
        productType,
        basePrice: parseFloat(basePrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        tax: { rate: parseFloat(taxRate) || 5, inclusive: true },
        bakeryVariants: bakeryVariants.map(v => ({
          sku: v.sku, size: v.size, weight: v.weight, flavour: v.flavour,
          isEggless: v.isEggless, unit: v.unit, stock: Number(v.stock),
          price: parseFloat(v.price) || parseFloat(salePrice) || 0,
        })),
        isEggless, isCustomizable: productType === 'CUSTOM_CAKE',
        isVegetarian,
        preparationHours: parseInt(preparationHours) || 24,
        shelfLifeDays: parseInt(shelfLifeDays) || 3,
        ingredients, allergens,
        storageInstructions,
        occasion: [],
        enabledOptions: { size: enableSize, flavour: enableFlavour, colour: enableColour, message: enableMessage, photoUpload: enablePhoto, topper: enableTopper, decoration: enableDecoration, notes: enableNotes },
        deliveryConfig: { sameDayAvailable, advanceNoticeHours: parseInt(advanceNoticeHours), serviceablePincodes: serviceablePincodes.split(',').map(s => s.trim()).filter(Boolean) },
        seo: { title: seoTitle, description: seoDesc, keywords: seoKeywords },
        images,
        thumbnail: images[mainIdx] || images[0] || '',
        status: targetStatus,
      };

      let res: any;
      if (productId) {
        res = await api.patch<{ success: boolean; product: any }>(`/admin/products/${productId}`, payload);
      } else {
        res = await api.post<{ success: boolean; product: any }>('/admin/products/cakes-bakes', payload);
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

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (title || images.length > 0) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [title, images]);

  const selectedCategory = categories.find(c => c._id === categoryId);
  const discount = basePrice && salePrice ? Math.round(((parseFloat(basePrice) - parseFloat(salePrice)) / parseFloat(basePrice)) * 100) : 0;
  const isCustomCake = productType === 'CUSTOM_CAKE';

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-30 bg-amber-50 border-b border-amber-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/admin/products" className="shrink-0 text-amber-600 hover:text-amber-900 transition-colors">
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-amber-600">
                  <span>Admin</span><ChevronRight size={10} /><span>Products</span><ChevronRight size={10} /><span className="text-amber-900">Cakes & Bakes Studio</span>
                </div>
                <h1 className="text-sm font-black uppercase tracking-tight text-amber-900 truncate">
                  {title || 'New Cakes & Bakes Product'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastSaved && <span className="text-[10px] text-amber-600 hidden sm:block">Saved {lastSaved.toLocaleTimeString()}</span>}
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded ${status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{status}</span>
              <button onClick={() => doSave('DRAFT')} disabled={saving}
                className="h-9 px-4 border border-amber-400 text-xs font-bold uppercase tracking-wider text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
              </button>
              <button onClick={() => doSave('ACTIVE')} disabled={publishing}
                className="h-9 px-4 bg-amber-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-amber-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publish
              </button>
            </div>
          </div>
        </div>

        {/* ── Error/Success ── */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1"><AlertCircle size={13} />Fix these issues:</p>
            <ul className="text-xs text-red-600 space-y-0.5 ml-4 list-disc">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}
        {successMsg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2"><CheckCircle2 size={14} />{successMsg}</div>}

        <div className="flex gap-8">
          {/* ── Tab Nav ── */}
          <aside className="w-44 shrink-0">
            <nav className="space-y-0.5 sticky top-24">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === tab ? 'bg-amber-800 text-white' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                  }`}>
                  {tab}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0">

            {/* ══ GENERAL ══ */}
            {activeTab === 'General' && (
              <div className="space-y-5">
                <SectionCard title="Product Information" accent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Field label="Product Name *">
                        <input value={title} onChange={e => setTitle(e.target.value)}
                          className="w-full h-10 border border-amber-200 px-3 text-sm focus:outline-none focus:border-amber-600"
                          placeholder="e.g. Premium Belgian Chocolate Truffle Cake" />
                      </Field>
                    </div>
                    <Field label="Brand / Bakery">
                      <input value={brand} onChange={e => setBrand(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600" placeholder="e.g. FastVelix Bakehouse" />
                    </Field>
                    <Field label="Subcategory *">
                      {loadingCats ? <p className="text-xs text-stone-400 animate-pulse h-10 flex items-center">Loading...</p> : (
                        <select value={subcategorySlug} onChange={e => setSubcategorySlug(e.target.value)}
                          className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600 bg-white">
                          {selectedCategory?.subcategories.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                        </select>
                      )}
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Short Description">
                        <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2} maxLength={500}
                          className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-600 resize-none"
                          placeholder="Brief description shown in product listings..." />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Full Description *">
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6}
                          className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-600 resize-none"
                          placeholder="Detailed product description for the product page..." />
                      </Field>
                    </div>
                  </div>
                </SectionCard>
                <SectionCard title="Tags & Status">
                  <div className="space-y-4">
                    <TagInput tags={tags} onChange={setTags} placeholder="e.g. birthday, chocolate, eggless" />
                    <Field label="Product Status">
                      <select value={status} onChange={e => setStatus(e.target.value as any)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600 bg-white max-w-xs">
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active (Published)</option>
                      </select>
                    </Field>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══ IMAGES ══ */}
            {activeTab === 'Images' && (
              <SectionCard title="Product Images" accent>
                <p className="text-xs text-amber-700 mb-4">Upload high-quality cake photos. Use the first slot for the main showcase image.</p>
                <ImageUploadBox images={images} onAdd={url => setImages(prev => [...prev, url])}
                  onRemove={i => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  onSetMain={setMainIdx} mainIdx={mainIdx} />
              </SectionCard>
            )}

            {/* ══ PRODUCT TYPE ══ */}
            {activeTab === 'Product Type' && (
              <SectionCard title="Product Type" accent>
                <p className="text-xs text-amber-700 mb-4">The product type controls which options and configuration tabs appear below.</p>
                <div className="grid grid-cols-1 gap-3">
                  {PRODUCT_TYPES.map(pt => (
                    <button key={pt.value} onClick={() => setProductType(pt.value)}
                      className={`text-left p-4 border-2 transition-all cursor-pointer rounded-sm ${productType === pt.value ? 'border-amber-700 bg-amber-50' : 'border-stone-200 hover:border-amber-300'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-sm text-stone-900">{pt.label}</span>
                          <p className="text-xs text-stone-500 mt-0.5">{pt.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${productType === pt.value ? 'border-amber-700 bg-amber-700' : 'border-stone-300'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ══ CAKE OPTIONS ══ */}
            {activeTab === 'Cake Options' && (
              <div className="space-y-5">
                {cakeSizes.length > 0 && (
                  <SectionCard title="Available Sizes (from Cake Configuration DB)" accent>
                    <p className="text-xs text-amber-600 mb-3">Select which sizes apply to this product. Manage sizes in <Link href="/admin/cakes" className="underline">Cakes & Bakes Config</Link>.</p>
                    <div className="space-y-2">
                      {cakeSizes.map(s => (
                        <label key={s._id} className={`flex items-center justify-between p-3 border-2 cursor-pointer rounded-sm transition-all ${selectedSizes.includes(s._id) ? 'border-amber-600 bg-amber-50' : 'border-stone-200 hover:border-amber-300'}`}>
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={selectedSizes.includes(s._id)} onChange={e => setSelectedSizes(p => e.target.checked ? [...p, s._id] : p.filter(x => x !== s._id))} className="cursor-pointer" />
                            <div>
                              <span className="font-bold text-sm text-stone-900">{s.name}</span>
                              <span className="text-xs text-stone-500 ml-2">({s.servings} servings)</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-amber-700">{s.extraPrice > 0 ? `+₹${s.extraPrice}` : 'Base'}</span>
                        </label>
                      ))}
                    </div>
                    {cakeSizes.length === 0 && <p className="text-xs text-stone-400">No sizes configured. <Link href="/admin/cakes" className="underline">Add sizes →</Link></p>}
                  </SectionCard>
                )}

                {cakeFlavours.length > 0 && (
                  <SectionCard title="Available Flavours (from Cake Configuration DB)" accent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {cakeFlavours.map(f => (
                        <label key={f._id} className={`flex items-center gap-2 p-3 border-2 cursor-pointer rounded-sm transition-all ${selectedFlavours.includes(f._id) ? 'border-amber-600 bg-amber-50' : 'border-stone-200 hover:border-amber-300'}`}>
                          <input type="checkbox" checked={selectedFlavours.includes(f._id)} onChange={e => setSelectedFlavours(p => e.target.checked ? [...p, f._id] : p.filter(x => x !== f._id))} className="cursor-pointer" />
                          <div>
                            <span className="font-bold text-xs text-stone-900">{f.name}</span>
                            {f.extraPrice > 0 && <span className="block text-[10px] text-amber-600">+₹{f.extraPrice}</span>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Manual bakery variants for non-custom cakes */}
                {productType !== 'CUSTOM_CAKE' && (
                  <SectionCard title="Product Variants / SKUs">
                    <div className="space-y-3 mb-4">
                      {bakeryVariants.map(v => (
                        <div key={v.id} className="grid grid-cols-6 gap-2 items-center border border-stone-200 p-3 rounded-sm text-xs">
                          <input value={v.sku} onChange={e => updateVariant(v.id, 'sku', e.target.value)} placeholder="SKU"
                            className="h-8 border border-stone-200 px-2 text-xs focus:outline-none col-span-1 font-mono uppercase" />
                          <input value={v.size} onChange={e => updateVariant(v.id, 'size', e.target.value)} placeholder="Size (e.g. 1kg)"
                            className="h-8 border border-stone-200 px-2 text-xs focus:outline-none" />
                          <input value={v.flavour} onChange={e => updateVariant(v.id, 'flavour', e.target.value)} placeholder="Flavour"
                            className="h-8 border border-stone-200 px-2 text-xs focus:outline-none" />
                          <input type="number" value={v.stock} onChange={e => updateVariant(v.id, 'stock', parseInt(e.target.value) || 0)} placeholder="Stock"
                            className="h-8 border border-stone-200 px-2 text-xs focus:outline-none" />
                          <input type="number" value={v.price} onChange={e => updateVariant(v.id, 'price', e.target.value)} placeholder="Price"
                            className="h-8 border border-stone-200 px-2 text-xs focus:outline-none" />
                          <button onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600 cursor-pointer flex justify-center"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={addVariant} className="flex items-center gap-1.5 h-9 px-4 border border-dashed border-amber-400 text-amber-700 text-xs font-bold cursor-pointer hover:bg-amber-50">
                      <Plus size={13} />Add Variant
                    </button>
                  </SectionCard>
                )}
              </div>
            )}

            {/* ══ CUSTOMIZATION ══ */}
            {activeTab === 'Customization' && (
              <SectionCard title="Customization Options" accent>
                <p className="text-xs text-amber-700 mb-4">
                  {isCustomCake ? 'Configure which options customers can personalize for this custom cake.' : 'For non-custom cake products, customization is limited.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Size Selection', val: enableSize, set: setEnableSize, desc: 'Let customers pick cake weight/size' },
                    { label: 'Flavour Selection', val: enableFlavour, set: setEnableFlavour, desc: 'Let customers pick flavour' },
                    { label: 'Colour Theme', val: enableColour, set: setEnableColour, desc: 'Let customers pick cake color' },
                    { label: 'Personalized Message', val: enableMessage, set: setEnableMessage, desc: 'Customer writes a cake message' },
                    { label: 'Photo Upload', val: enablePhoto, set: setEnablePhoto, desc: 'Customer uploads a photo for printing' },
                    { label: 'Topper Selection', val: enableTopper, set: setEnableTopper, desc: 'Let customers pick cake toppers' },
                    { label: 'Decoration Add-ons', val: enableDecoration, set: setEnableDecoration, desc: 'Extra decorations (gold foil, macarons)' },
                    { label: 'Additional Notes', val: enableNotes, set: setEnableNotes, desc: 'Free-text notes from customer' },
                  ].map(opt => (
                    <label key={opt.label} className={`flex items-center justify-between p-3 border-2 cursor-pointer rounded-sm transition-all ${opt.val ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}>
                      <div>
                        <span className="font-bold text-sm text-stone-900">{opt.label}</span>
                        <p className="text-xs text-stone-500">{opt.desc}</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${opt.val ? 'bg-amber-600' : 'bg-stone-300'}`}
                        onClick={() => opt.set(!opt.val)}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${opt.val ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ══ PRICING ══ */}
            {activeTab === 'Pricing' && (
              <div className="space-y-5">
                <SectionCard title="Price Configuration" accent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="MRP (₹) *">
                      <input type="number" min="0" value={basePrice} onChange={e => setBasePrice(e.target.value)}
                        className="w-full h-10 border border-amber-200 px-3 text-sm focus:outline-none focus:border-amber-600" placeholder="999" />
                    </Field>
                    <Field label="Sale Price (₹) *">
                      <input type="number" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                        className="w-full h-10 border border-amber-200 px-3 text-sm focus:outline-none focus:border-amber-600" placeholder="849" />
                    </Field>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Discount</label>
                      <div className="h-10 border border-stone-100 bg-stone-50 px-3 flex items-center text-sm font-mono font-bold text-emerald-600">
                        {discount > 0 ? `${discount}% OFF` : '—'}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {isCustomCake && cakeSizes.length > 0 && (
                  <SectionCard title="Custom Cake Pricing Breakdown" accent>
                    <p className="text-xs text-amber-700 mb-3">Visual guide to how the final price is calculated for custom cake orders.</p>
                    <div className="space-y-2 text-xs">
                      {[
                        { label: 'Base Price', value: `₹${salePrice || '—'}` },
                        ...cakeSizes.filter(s => selectedSizes.includes(s._id) && s.extraPrice > 0).map(s => ({ label: `+ Size: ${s.name}`, value: `₹${s.extraPrice}` })),
                        ...cakeFlavours.filter(f => selectedFlavours.includes(f._id) && f.extraPrice > 0).map(f => ({ label: `+ Flavour: ${f.name}`, value: `₹${f.extraPrice}` })),
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-amber-100">
                          <span className="text-stone-700">{row.label}</span>
                          <span className="font-mono font-bold text-amber-800">{row.value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 font-extrabold text-sm">
                        <span className="text-stone-900">Final Price</span>
                        <span className="text-amber-900 font-mono">Calculated at checkout</span>
                      </div>
                    </div>
                  </SectionCard>
                )}

                <SectionCard title="GST Configuration">
                  <Field label="GST Rate (%)">
                    <input type="number" min="0" max="28" value={taxRate} onChange={e => setTaxRate(e.target.value)}
                      className="w-full max-w-xs h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600" />
                  </Field>
                  <p className="text-xs text-stone-400 mt-2">Food products typically attract 5% or 12% GST. Price is inclusive of GST.</p>
                </SectionCard>
              </div>
            )}

            {/* ══ DELIVERY ══ */}
            {activeTab === 'Delivery' && (
              <div className="space-y-5">
                <SectionCard title="Delivery Configuration" accent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Preparation Time (hours)">
                      <input type="number" min="1" value={preparationHours} onChange={e => setPreparationHours(e.target.value)}
                        className="w-full h-10 border border-amber-200 px-3 text-sm focus:outline-none focus:border-amber-600" />
                      <p className="text-[10px] text-stone-400 mt-1">How many hours in advance must the order be placed?</p>
                    </Field>
                    <Field label="Minimum Advance Notice (hours)">
                      <input type="number" min="0" value={advanceNoticeHours} onChange={e => setAdvanceNoticeHours(e.target.value)}
                        className="w-full h-10 border border-amber-200 px-3 text-sm focus:outline-none focus:border-amber-600" />
                    </Field>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Same-Day Delivery Available?</label>
                      <div className="flex gap-4">
                        {[true, false].map(v => (
                          <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={sameDayAvailable === v} onChange={() => setSameDayAvailable(v)} />
                            {v ? 'Yes' : 'No'}
                          </label>
                        ))}
                      </div>
                    </div>
                    <Field label="Availability Type">
                      <select value={availabilityType} onChange={e => setAvailabilityType(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600 bg-white">
                        <option value="ALWAYS_AVAILABLE">Always Available</option>
                        <option value="MADE_TO_ORDER">Made to Order</option>
                        <option value="LIMITED_STOCK">Limited Stock</option>
                        <option value="PRE_ORDER">Pre-Order</option>
                        <option value="TEMPORARILY_UNAVAILABLE">Temporarily Unavailable</option>
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Serviceable Pincodes (comma-separated)">
                        <input value={serviceablePincodes} onChange={e => setServiceablePincodes(e.target.value)}
                          className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600"
                          placeholder="e.g. 110001, 110002, 400001" />
                        <p className="text-[10px] text-stone-400 mt-1">Leave blank to allow delivery to all pincodes.</p>
                      </Field>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══ INGREDIENTS ══ */}
            {activeTab === 'Ingredients' && (
              <div className="space-y-5">
                <SectionCard title="Dietary Information" accent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Eggless?</label>
                      <div className="flex gap-4">
                        {[true, false].map(v => (
                          <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={isEggless === v} onChange={() => setIsEggless(v)} />
                            {v ? 'Eggless ✓' : 'Contains Eggs'}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Vegetarian?</label>
                      <div className="flex gap-4">
                        {[true, false].map(v => (
                          <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={isVegetarian === v} onChange={() => setIsVegetarian(v)} />
                            {v ? 'Vegetarian' : 'Non-Vegetarian'}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Ingredients">
                  <TagInput tags={ingredients} onChange={setIngredients} placeholder="e.g. Flour, Sugar, Butter (press Enter)" />
                </SectionCard>

                <SectionCard title="Allergens">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ALLERGENS_LIST.map(a => (
                      <button key={a} onClick={() => setAllergens(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])}
                        className={`px-3 py-1.5 text-xs font-bold border-2 cursor-pointer transition-colors ${allergens.includes(a) ? 'border-amber-700 bg-amber-700 text-white' : 'border-stone-200 text-stone-600 hover:border-amber-400'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Storage & Shelf Life">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Storage Instructions">
                      <input value={storageInstructions} onChange={e => setStorageInstructions(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600"
                        placeholder="e.g. Refrigerate and consume within 3 days" />
                    </Field>
                    <Field label="Shelf Life (days)">
                      <input type="number" min="1" value={shelfLifeDays} onChange={e => setShelfLifeDays(e.target.value)}
                        className="w-full h-10 border border-stone-200 px-3 text-sm focus:outline-none focus:border-amber-600" />
                    </Field>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══ SEO ══ */}
            {activeTab === 'SEO' && (
              <SectionCard title="Search Engine Optimization" accent>
                <div className="space-y-4">
                  <Field label="SEO Title">
                    <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
                      className="w-full h-10 border border-amber-200 px-3 text-sm focus:outline-none focus:border-amber-600"
                      placeholder="Product Name | FastVelix Cakes & Bakes" />
                    <p className="text-[10px] text-stone-400 mt-1">{seoTitle.length}/70 characters</p>
                  </Field>
                  <Field label="Meta Description">
                    <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={3}
                      className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-600 resize-none"
                      placeholder="Compelling description for search results (120–160 chars recommended)" />
                    <p className="text-[10px] text-stone-400 mt-1">{seoDesc.length}/160 characters</p>
                  </Field>
                  <SlugField value={slug} onChange={setSlug} productId={productId || undefined} />
                  <TagInput tags={seoKeywords} onChange={setSeoKeywords} placeholder="SEO keyword tags" />
                </div>
              </SectionCard>
            )}

            {/* ══ PREVIEW ══ */}
            {activeTab === 'Preview' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded text-xs text-amber-700 flex items-center gap-2">
                  <Info size={13} />This is a preview using the current form data. Nothing is saved until you click Save Draft or Publish.
                </div>
                <div className="bg-white border border-stone-200 p-6 max-w-sm rounded-sm">
                  {images[mainIdx]
                    ? <img src={images[mainIdx]} alt={title} className="w-full aspect-square object-cover mb-4 rounded-sm" />
                    : <div className="w-full aspect-square bg-amber-50 flex items-center justify-center mb-4 rounded-sm text-amber-300 text-xs border border-amber-200">No image uploaded</div>
                  }
                  {brand && <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 mb-1">{brand}</p>}
                  <h2 className="font-bold text-sm text-stone-900 mb-1">{title || 'Product Name'}</h2>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-black text-stone-900">₹{salePrice || '—'}</span>
                    {basePrice && basePrice !== salePrice && <span className="text-sm text-stone-400 line-through">₹{basePrice}</span>}
                    {discount > 0 && <span className="text-xs font-bold text-emerald-600">{discount}% OFF</span>}
                  </div>
                  {isEggless && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full mr-1">🌿 Eggless</span>}
                  {isVegetarian && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">🟢 Veg</span>}
                  {shortDesc && <p className="text-xs text-stone-500 mt-3 line-clamp-3">{shortDesc}</p>}
                  {isCustomCake && (
                    <button className="w-full mt-4 h-9 bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-sm">
                      Customize This Cake →
                    </button>
                  )}
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
