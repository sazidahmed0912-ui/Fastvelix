'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategorySwitch from '@/components/CategorySwitch';
import ProductCard from '@/components/ProductCard';
import ProductGrid from '@/components/ProductGrid';
import FilterSidebar from '@/components/FilterSidebar';
import { useStore } from '@/store/useStore';
import { api } from '@/utils/api';
import {
  Star,
  ShoppingBag,
  Heart,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Cake,
  Truck
} from 'lucide-react';

export default function CakesAndBakesSlugPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params?.slug as string) || '';

  const { addToCart, toggleWishlist, wishlist } = useStore();

  const CATEGORY_SLUGS: Record<string, string> = {
    cakes: 'Celebration Cakes',
    cupcakes: 'Gourmet Cupcakes',
    pastries: 'Fresh Pastries',
    desserts: 'Artisanal Desserts & Cheesecakes',
    bakery: 'Artisanal Bakes',
    gifts: 'Celebration Gift Boxes & Hampers',
  };

  const isCategory = Boolean(CATEGORY_SLUGS[rawSlug.toLowerCase()]);

  // Category view state
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});

  // Product detail view state
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('0.5 kg');
  const [selectedFlavour, setSelectedFlavour] = useState('');
  const [isEggless, setIsEggless] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);

  // Load category products if it's a category route
  useEffect(() => {
    if (!isCategory) return;
    async function loadCategoryBakes() {
      setCategoryLoading(true);
      try {
        const queryParams = new URLSearchParams({
          topLevelCategory: 'CAKES_AND_BAKES',
          limit: '24',
          ...filters,
        });

        const res = await api.get<{ success: boolean; products: any[] }>(`/products?${queryParams.toString()}`);
        if (res.success) {
          setCategoryProducts(res.products);
        }
      } catch (err) {
        console.error('Error loading category products:', err);
      } finally {
        setCategoryLoading(false);
      }
    }
    loadCategoryBakes();
  }, [isCategory, rawSlug, filters]);

  // Load product details if it's a product route
  useEffect(() => {
    if (isCategory || !rawSlug) return;
    async function loadProductData() {
      setProductLoading(true);
      try {
        const res = await api.get<{ success: boolean; product: any }>(`/products/${rawSlug}`);
        if (res.success && res.product) {
          setProduct(res.product);
          setSelectedFlavour(res.product.flavour || 'Belgian Chocolate');
          setIsEggless(res.product.isEggless ?? true);
          if (res.product.bakeryVariants?.length > 0) {
            setSelectedSize(res.product.bakeryVariants[0].size || '0.5 kg');
          }

          const relRes = await api.get<{ success: boolean; products: any[] }>(
            `/products?topLevelCategory=CAKES_AND_BAKES&limit=4`
          );
          if (relRes.success) {
            setRelatedProducts(relRes.products.filter((p) => p._id !== res.product._id));
          }
        }
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setProductLoading(false);
      }
    }
    loadProductData();
  }, [isCategory, rawSlug]);

  // ─── RENDER CATEGORY LISTING VIEW ───
  if (isCategory) {
    const pageTitle = CATEGORY_SLUGS[rawSlug.toLowerCase()];
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        <Header />
        <CategorySwitch />

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Compact Category Banner */}
          <div className="relative w-full h-[140px] sm:h-[180px] md:h-[220px] rounded-xl overflow-hidden bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 flex items-center mb-4 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200"
              alt={pageTitle}
              className="absolute inset-0 w-full h-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-950/90 via-stone-900/80 to-transparent" />
            <div className="relative z-10 px-6 sm:px-8 text-white space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-700/50">
                Studio Bakery
              </span>
              <h1 className="text-xl sm:text-3xl font-serif font-bold text-white leading-tight">{pageTitle}</h1>
              <p className="text-xs text-stone-200 max-w-md">Freshly baked by master pastry chefs with time-slot delivery available.</p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="hidden lg:block w-60 shrink-0 sticky top-28">
              <FilterSidebar category="CAKES_AND_BAKES" type="CAKES_AND_BAKES" onFilterChange={setFilters} />
            </div>

            <div className="flex-1 min-w-0">
              <ProductGrid products={categoryProducts} isLoading={categoryLoading} emptyMessage="No bakes match your filters." />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── RENDER PRODUCT DETAIL VIEW ───
  if (productLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <div className="max-w-7xl mx-auto p-12 text-center">
          <div className="h-12 w-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-serif">Loading delicious details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <div className="max-w-7xl mx-auto p-12 text-center">
          <h2 className="text-2xl font-serif font-bold text-stone-800">Cake Not Found</h2>
          <p className="text-stone-500 mt-2">The bakery product you are looking for is no longer available.</p>
          <Link href="/cakes-and-bakes" className="inline-block mt-4 text-emerald-800 font-bold underline">
            Back to Cakes & Bakes
          </Link>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.some((item) => item.productId._id === product._id);
  const images = product.images?.length > 0 ? product.images : [product.thumbnail];
  const activeImage = images[activeImageIndex] || product.thumbnail;
  const currentVariant = product.bakeryVariants?.find((v: any) => v.size === selectedSize);
  const currentPrice = currentVariant?.price || product.salePrice;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const sku = currentVariant?.sku || `BAKE-${product._id.substring(0, 6)}`;
      await addToCart(product._id, sku, quantity, {
        size: selectedSize,
        flavour: selectedFlavour,
        customPrice: currentPrice,
      });
      router.push('/cart');
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Header />
      <CategorySwitch />

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-stone-500 flex items-center gap-2">
        <Link href="/" className="hover:text-stone-900">Home</Link>
        <ChevronRight size={12} />
        <Link href="/cakes-and-bakes" className="hover:text-stone-900">Cakes & Bakes</Link>
        <ChevronRight size={12} />
        <span className="text-stone-900 font-semibold truncate">{product.title}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-6 sm:p-10 rounded-2xl border border-stone-200 shadow-sm">
          <div className="space-y-4">
            <div className="relative h-[380px] sm:h-[480px] w-full rounded-xl overflow-hidden border border-stone-200 shadow-sm">
              <Image src={activeImage} alt={product.title} fill priority className="object-cover" />
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 w-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      activeImageIndex === idx ? 'border-emerald-800 ring-2 ring-emerald-800/20' : 'border-stone-200'
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded">
                  {product.productType || 'STANDARD_CAKE'}
                </span>
                {isEggless && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                    🟢 100% Eggless
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-serif font-bold text-stone-900">{product.title}</h1>
              <p className="text-xs text-stone-500 mt-1">Baked by: <span className="font-semibold text-stone-700">Velvet Artisanal Bakery</span></p>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 text-xs font-bold">
                  <span>{product.ratings?.average || 4.9}</span>
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                </div>
                <span className="text-xs text-stone-500">({product.ratings?.count || 48} reviews)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3 border-t border-b border-stone-100 py-4">
              <span className="text-3xl font-serif font-bold text-stone-900">₹{currentPrice}</span>
              {product.basePrice > currentPrice && (
                <>
                  <span className="text-sm text-stone-400 line-through">₹{product.basePrice}</span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    {Math.round(((product.basePrice - currentPrice) / product.basePrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {product.bakeryVariants?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase">Select Weight / Size</label>
                <div className="flex gap-3">
                  {product.bakeryVariants.map((v: any) => (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedSize(v.size)}
                      className={`px-4 py-2 border text-xs font-bold rounded cursor-pointer transition-all ${
                        selectedSize === v.size
                          ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                          : 'border-stone-200 hover:border-stone-400 text-stone-800'
                      }`}
                    >
                      {v.size} (₹{v.price})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                <span>Lead Time: {product.preparationHours || 24}h Fresh Bake</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-emerald-700" />
                <span>Time-Slot Delivery Available</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-700" />
                <span>100% Hygienic Packaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Cake size={16} className="text-amber-600" />
                <span>Shelf Life: {product.shelfLifeDays || 3} Days</span>
              </div>
            </div>

            {product.ingredients?.length > 0 && (
              <div className="space-y-1 text-xs text-stone-600">
                <p><span className="font-bold text-stone-800">Ingredients:</span> {product.ingredients.join(', ')}</p>
                {product.allergens?.length > 0 && (
                  <p><span className="font-bold text-stone-800">Allergens:</span> {product.allergens.join(', ')}</p>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                disabled={adding}
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShoppingBag size={18} />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>

              <Link
                href="/cakes-and-bakes/custom-cake"
                className="py-4 px-6 border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> Customize
              </Link>

              <button
                onClick={() => toggleWishlist(product._id)}
                className={`p-4 border rounded-none cursor-pointer transition-colors ${
                  isWishlisted ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                <Heart size={20} className={isWishlisted ? 'fill-rose-500' : ''} />
              </button>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="py-16">
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-8">You Might Also Love</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel._id} product={rel} />
              ))}
            </div>
          </section>
        )}

        {/* STICKY BOTTOM BAR (MOBILE ONLY) */}
        <div className="lg:hidden fixed bottom-14 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 z-30 flex items-center gap-2.5 shadow-xl">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-stone-400 font-bold block uppercase">Total Price</span>
            <span className="text-base font-extrabold text-stone-900 leading-tight">₹{currentPrice}</span>
          </div>

          <button
            disabled={adding}
            onClick={handleAddToCart}
            className="flex-1 h-11 bg-emerald-800 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[11px] rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <ShoppingBag size={14} />
            <span>{adding ? 'Adding...' : 'Add to Cart'}</span>
          </button>

          <Link
            href="/cakes-and-bakes/custom-cake"
            className="px-3.5 h-11 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold uppercase tracking-wider text-[11px] rounded flex items-center justify-center gap-1 transition-colors shrink-0"
          >
            <Sparkles size={13} /> Customize
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
