'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { ShieldCheck, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

export default function NewProductPage() {
  const router = useRouter();

  const [topLevelCategory, setTopLevelCategory] = useState<'FASHION' | 'CAKES_AND_BAKES'>('FASHION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategorySlug, setSubcategorySlug] = useState('');

  // Fashion-specific variant inputs
  const [fashionVariants, setFashionVariants] = useState<any[]>([
    { sku: '', size: 'M', color: 'White', stock: 10, price: '' }
  ]);
  const [material, setMaterial] = useState('');
  const [fit, setFit] = useState('');
  const [gender, setGender] = useState('UNISEX');
  const [style, setStyle] = useState('');

  // Cakes & Bakes-specific variant inputs
  const [bakeryVariants, setBakeryVariants] = useState<any[]>([
    { sku: '', size: '500g', weight: '500g', servings: 4, isEggless: false, stock: 20, price: '' }
  ]);
  const [flavour, setFlavour] = useState('');
  const [isEggless, setIsEggless] = useState(false);
  const [shelfLife, setShelfLife] = useState('');
  const [allergens, setAllergens] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [topLevelCategory]);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; categories: any[] }>(`/categories?topLevelCategory=${topLevelCategory}`);
      if (data.success && data.categories.length > 0) {
        setCategories(data.categories);
        setCategoryId(data.categories[0]._id);
        if (data.categories[0].subcategories?.length > 0) {
          setSubcategorySlug(data.categories[0].subcategories[0].slug);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddFashionVariant = () => {
    setFashionVariants([...fashionVariants, { sku: '', size: 'M', color: 'White', stock: 10, price: '' }]);
  };

  const handleRemoveFashionVariant = (idx: number) => {
    setFashionVariants(fashionVariants.filter((_, i) => i !== idx));
  };

  const handleFashionVariantChange = (idx: number, field: string, val: any) => {
    const updated = [...fashionVariants];
    updated[idx][field] = val;
    setFashionVariants(updated);
  };

  const handleAddBakeryVariant = () => {
    setBakeryVariants([...bakeryVariants, { sku: '', size: '500g', weight: '500g', servings: 4, isEggless: false, stock: 20, price: '' }]);
  };

  const handleRemoveBakeryVariant = (idx: number) => {
    setBakeryVariants(bakeryVariants.filter((_, i) => i !== idx));
  };

  const handleBakeryVariantChange = (idx: number, field: string, val: any) => {
    const updated = [...bakeryVariants];
    updated[idx][field] = val;
    setBakeryVariants(updated);
  };

  const handleDietaryToggle = (val: string) => {}; // kept for potential reuse

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedBase = Number(basePrice);
    const parsedSale = Number(salePrice);

    if (parsedSale > parsedBase) {
      setErrorMsg('Sale price cannot exceed original base price.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        topLevelCategory,
        title,
        description,
        shortDescription,
        brand,
        categoryId,
        subcategorySlug,
        basePrice: parsedBase,
        salePrice: parsedSale,
      };

      if (topLevelCategory === 'FASHION') {
        // Map types and validate empty skus
        payload.fashionVariants = fashionVariants.map((v) => ({
          sku: v.sku.toUpperCase() || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          size: v.size,
          color: v.color,
          stock: Number(v.stock),
          price: v.price ? Number(v.price) : undefined,
        }));
        payload.material = material;
        payload.fit = fit;
        payload.gender = gender;
        payload.style = style;
      } else {
        payload.bakeryVariants = bakeryVariants.map((v) => ({
          sku: v.sku.toUpperCase() || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          size: v.size,
          weight: v.weight,
          servings: Number(v.servings),
          isEggless: Boolean(v.isEggless),
          stock: Number(v.stock),
          price: v.price ? Number(v.price) : parsedSale,
        }));
        payload.flavour = flavour;
        payload.isEggless = isEggless;
        payload.shelfLife = shelfLife;
        payload.allergens = allergens;
      }

      const data = await api.post<{ success: boolean; product: any }>('/products', payload);
      if (data.success) {
        alert('Product draft created successfully! Next, configure product mock assets.');
        router.push(`/seller/products`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <div className="mb-6">
          <Link href="/seller" className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-dark">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 p-8 shadow-sm-custom">
          
          <h1 className="text-2xl font-bold tracking-tight uppercase flex items-center gap-2">
            Add New Product
          </h1>
          <p className="text-xs text-neutral-500 mt-1 pb-4 border-b border-neutral-100">
            Publish your items to either the Fashion catalog or the Cakes &amp; Bakes bakery marketplace.
          </p>

          {errorMsg && (
            <p className="p-3 bg-red-50 text-red-600 text-xs font-semibold mb-6 border-l-4 border-red-500">{errorMsg}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            
            {/* Top Level Category Selector (Immutable after selection) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Commerce Vertical</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTopLevelCategory('FASHION')}
                  className={clsx(
                    "h-11 border text-xs font-bold uppercase tracking-wider cursor-pointer",
                    topLevelCategory === 'FASHION' ? "bg-dark border-dark text-white shadow-sm" : "bg-white border-neutral-200"
                  )}
                >
                  Fashion (Clothing / Footwear)
                </button>
                <button
                  type="button"
                  onClick={() => setTopLevelCategory('CAKES_AND_BAKES')}
                  className={clsx(
                    "h-11 border text-xs font-bold uppercase tracking-wider cursor-pointer",
                    topLevelCategory === 'CAKES_AND_BAKES' ? "bg-emerald-800 border-emerald-800 text-white shadow-sm" : "bg-white border-neutral-200"
                  )}
                >
                  Cakes &amp; Bakes (Bakery / Custom Cakes)
                </button>
              </div>
            </div>

            {/* General Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Product Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Classic White Linen Shirt" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Full Description</label>
                <textarea rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Brand Name</label>
                <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. TrendHub" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Subcategory</label>
                <select
                  value={subcategorySlug}
                  onChange={(e) => setSubcategorySlug(e.target.value)}
                  className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm bg-white"
                >
                  {categories.flatMap((c) => c.subcategories || []).map((sc: any) => (
                    <option key={sc.slug} value={sc.slug}>{sc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Original Base Price (₹)</label>
                <input type="number" required value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Offer Sale Price (₹)</label>
                <input type="number" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
              </div>
            </div>

            {/* FASHION DYNAMIC FORMS */}
            {topLevelCategory === 'FASHION' && (
              <div className="space-y-6 border-t border-neutral-100 pt-6">
                <h3 className="font-extrabold text-sm text-neutral-400 uppercase tracking-wider">Fashion Properties</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Material</label>
                    <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. 100% Linen" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Fit Type</label>
                    <input type="text" value={fit} onChange={(e) => setFit(e.target.value)} placeholder="e.g. Slim Fit" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Target Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm bg-white">
                      <option value="MEN">Men</option>
                      <option value="WOMEN">Women</option>
                      <option value="KIDS">Kids</option>
                      <option value="UNISEX">Unisex</option>
                    </select>
                  </div>
                </div>

                {/* Fashion Size/Color variants management */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">SKU Variants (Size & Color)</h4>
                    <button type="button" onClick={handleAddFashionVariant} className="text-xs font-bold text-brand hover:underline">+ Add Variant</button>
                  </div>

                  {fashionVariants.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-neutral-50 p-3 border">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">SKU ID</label>
                        <input type="text" value={item.sku} onChange={(e) => handleFashionVariantChange(idx, 'sku', e.target.value)} placeholder="e.g. WHT-M" className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Size</label>
                        <input type="text" required value={item.size} onChange={(e) => handleFashionVariantChange(idx, 'size', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Color Name</label>
                        <input type="text" required value={item.color} onChange={(e) => handleFashionVariantChange(idx, 'color', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Stock Qty</label>
                        <input type="number" required value={item.stock} onChange={(e) => handleFashionVariantChange(idx, 'stock', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow">
                          <label className="block text-[10px] font-bold text-neutral-500 mb-1">Price (Optional)</label>
                          <input type="number" value={item.price} onChange={(e) => handleFashionVariantChange(idx, 'price', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                        </div>
                        {fashionVariants.length > 1 && (
                          <button type="button" onClick={() => handleRemoveFashionVariant(idx)} className="text-red-500 hover:bg-neutral-100 p-1.5 rounded cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CAKES & BAKES DYNAMIC FORMS */}
            {topLevelCategory === 'CAKES_AND_BAKES' && (
              <div className="space-y-6 border-t border-neutral-100 pt-6">
                <h3 className="font-extrabold text-sm text-neutral-400 uppercase tracking-wider">Bakery Specifications</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Primary Flavour</label>
                    <input type="text" value={flavour} onChange={(e) => setFlavour(e.target.value)} placeholder="e.g. Belgian Chocolate Truffle" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Shelf Life</label>
                    <input type="text" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} placeholder="e.g. 3 days at room temp" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Allergens</label>
                    <input type="text" value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="e.g. Contains Gluten, Dairy" className="w-full h-10 px-3 border border-neutral-200 focus:outline-none focus:border-dark text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 h-8">
                  <input type="checkbox" id="isEggless" checked={isEggless} onChange={(e) => setIsEggless(e.target.checked)} className="accent-emerald-800 h-4 w-4" />
                  <label htmlFor="isEggless" className="text-xs font-bold uppercase tracking-wider text-neutral-500 cursor-pointer">Eggless (Pure Veg)</label>
                </div>

                {/* Bakery Size/Weight variants */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">SKU Variants (Size &amp; Weight)</h4>
                    <button type="button" onClick={handleAddBakeryVariant} className="text-xs font-bold text-emerald-800 hover:underline">+ Add Size</button>
                  </div>

                  {bakeryVariants.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end bg-neutral-50 p-3 border">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">SKU ID</label>
                        <input type="text" value={item.sku} onChange={(e) => handleBakeryVariantChange(idx, 'sku', e.target.value)} placeholder="e.g. CHOC-1KG" className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Size Label</label>
                        <input type="text" required value={item.size} onChange={(e) => handleBakeryVariantChange(idx, 'size', e.target.value)} placeholder="e.g. 1 kg" className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Weight</label>
                        <input type="text" value={item.weight} onChange={(e) => handleBakeryVariantChange(idx, 'weight', e.target.value)} placeholder="e.g. 1000g" className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Servings</label>
                        <input type="number" value={item.servings} onChange={(e) => handleBakeryVariantChange(idx, 'servings', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Stock Qty</label>
                        <input type="number" required value={item.stock} onChange={(e) => handleBakeryVariantChange(idx, 'stock', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow">
                          <label className="block text-[10px] font-bold text-neutral-500 mb-1">Price (₹)</label>
                          <input type="number" value={item.price} onChange={(e) => handleBakeryVariantChange(idx, 'price', e.target.value)} className="w-full h-9 px-2 border border-neutral-200 bg-white text-xs" />
                        </div>
                        {bakeryVariants.length > 1 && (
                          <button type="button" onClick={() => handleRemoveBakeryVariant(idx)} className="text-red-500 hover:bg-neutral-100 p-1.5 rounded cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-6 border-t border-neutral-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-dark hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating Draft…' : 'Create Product Draft'}
              </button>
              <p className="text-xs text-neutral-400 text-center mt-2">Product will be reviewed before going live on the marketplace.</p>
            </div>

          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
