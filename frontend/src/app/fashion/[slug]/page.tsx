'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { Heart, ShoppingBag, Truck, RefreshCw, ShieldCheck, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface FashionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function FashionDetailPage({ params }: FashionDetailPageProps) {
  const router = useRouter();
  const { wishlist, toggleWishlist, addToCart } = useStore();

  const [slug, setSlug] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [cartMsg, setCartMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    params.then((res) => setSlug(res.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; product: any }>(`/products/${slug}`);
        if (data.success) {
          setProduct(data.product);
          setActiveImage(data.product.thumbnail || data.product.images?.[0] || '');
        }
      } catch (err: any) {
        setError(err.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-sm text-neutral-400 animate-pulse">
          Loading fashion details...
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-xl font-bold">Product Not Found</h2>
          <p className="text-sm text-neutral-500 mt-2">{error || 'This product is no longer active.'}</p>
        </main>
        <Footer />
      </>
    );
  }

  const isWishlisted = wishlist.some((item) => item.productId?._id === product._id);

  // Get matching variants based on selections
  const sizes = Array.from(new Set(product.fashionVariants?.map((v: any) => v.size) || []));
  const colors = Array.from(new Set(product.fashionVariants?.map((v: any) => v.color) || []));

  // Determine availability of active selection
  const selectedVariant = product.fashionVariants?.find(
    (v: any) => v.size === selectedSize && v.color === selectedColor
  );

  const isSelectedInStock = selectedVariant ? (selectedVariant.stock - (selectedVariant.reservedStock || 0)) >= quantity : product.totalStock > 0;
  const isSelectionComplete = selectedSize && selectedColor;

  const handleAddToCart = async () => {
    if (!useStore.getState().user) {
      router.push('/login');
      return;
    }
    if (!isSelectionComplete || !selectedVariant) {
      setCartMsg({ type: 'error', text: 'Please select both a Size and Color.' });
      return;
    }

    setIsAdding(true);
    setCartMsg(null);
    try {
      await addToCart(product._id, selectedVariant.sku, quantity);
      setCartMsg({ type: 'success', text: '✓ Added to cart successfully!' });
      setTimeout(() => setCartMsg(null), 4000);
    } catch (err: any) {
      if (err.status === 401 || err.code === 'AUTHENTICATION_REQUIRED') {
        router.push('/login');
      } else {
        setCartMsg({ type: 'error', text: err.message || 'Failed to add item to cart.' });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!useStore.getState().user) {
      router.push('/login');
      return;
    }
    if (!isSelectionComplete || !selectedVariant) {
      alert('Please select size and color.');
      return;
    }
    try {
      await addToCart(product._id, selectedVariant.sku, quantity);
      router.push('/checkout');
    } catch (err: any) {
      if (err.status === 401 || err.code === 'AUTHENTICATION_REQUIRED') {
        router.push('/login');
      } else {
        alert(err.message || 'Failed to process buy now.');
      }
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          {/* Column 1: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-neutral-50 overflow-hidden border border-neutral-100 relative group">
              {activeImage && (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={clsx(
                      "w-20 h-24 border relative overflow-hidden cursor-pointer",
                      activeImage === img ? "border-dark" : "border-neutral-200"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover object-center" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Info details */}
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">
                {product.brand || 'FASTVELIX FASHION'}
              </span>
              <h1 className="text-2xl font-bold tracking-tight mt-1">{product.title}</h1>
              
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs font-semibold">
                  <Star size={14} fill="#eab308" className="text-yellow-500" />
                  <span>{product.ratings?.average || '0.0'}</span>
                  <span className="text-neutral-400">({product.ratings?.count || 0} reviews)</span>
                </div>
                {product.gender && (
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 uppercase font-bold tracking-wider">
                    {product.gender}
                  </span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-neutral-50 border border-neutral-200/60 flex items-baseline gap-3">
              <span className="text-2xl font-extrabold">₹{product.salePrice.toLocaleString('en-IN')}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-sm text-neutral-400 line-through">₹{product.basePrice.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-brand font-bold uppercase tracking-wider bg-brand-light px-2 py-0.5">
                    Save {product.discount}%
                  </span>
                </>
              )}
            </div>

            {/* VARIANT COLOR SELECTOR */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Color</h4>
              <div className="flex flex-wrap gap-2">
                {colors.map((c: any) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
                      selectedColor === c
                        ? "bg-dark border-dark text-white"
                        : "bg-white border-neutral-200 text-neutral-600 hover:border-dark"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* VARIANT SIZE SELECTOR */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Size</h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s: any) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
                      selectedSize === s
                        ? "bg-dark border-dark text-white"
                        : "bg-white border-neutral-200 text-neutral-600 hover:border-dark"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty Selector */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Quantity</h4>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-10 w-20 border border-neutral-200 text-sm px-2 bg-white outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Purchase triggers */}
            <div className="flex flex-col gap-3 pt-4">
              {cartMsg && (
                <div className={clsx(
                  'px-4 py-3 text-xs font-semibold border-l-4',
                  cartMsg.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-500'
                    : 'bg-red-50 text-red-600 border-red-500'
                )}>
                  {cartMsg.text}
                </div>
              )}
              <div className="flex flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || !isSelectedInStock}
                  className={clsx(
                    "flex-1 h-12 bg-white border border-dark text-dark hover:bg-neutral-50 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50",
                    (!isSelectionComplete || !isSelectedInStock) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <ShoppingBag size={16} />
                  <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!isSelectedInStock}
                  className={clsx(
                    "flex-1 h-12 bg-dark hover:bg-neutral-800 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer",
                    (!isSelectionComplete || !isSelectedInStock) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Buy Now
                </button>

                <button
                  onClick={() => toggleWishlist(product._id)}
                  className={clsx(
                    "h-12 w-12 border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 cursor-pointer transition-colors",
                    isWishlisted && "text-red-500 border-red-200 bg-red-50"
                  )}
                >
                  <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Shipping Trust section */}
            <div className="pt-6 border-t border-neutral-100 text-xs text-neutral-500 space-y-3">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-brand" />
                <span>Eligible for Free Standard Delivery above ₹499.</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-brand" />
                <span>Return Window: {product.returnWindow || 7} days easy cancellation & return policy.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-brand" />
                <span>Premium Quality Assured from TrendHub verified merchants.</span>
              </div>
            </div>

            {/* Product description & Specifications */}
            <div className="pt-6 border-t border-neutral-100">
              <h3 className="font-bold text-sm">Product Description</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="pt-6 border-t border-neutral-100">
                <h3 className="font-bold text-sm">Product Specifications</h3>
                <div className="grid grid-cols-2 gap-y-2 mt-3 text-xs">
                  {Object.entries(product.specifications).map(([key, val]: any) => (
                    <React.Fragment key={key}>
                      <span className="font-semibold text-neutral-400 uppercase tracking-wider">{key}</span>
                      <span className="text-neutral-600">{val}</span>
                    </React.Fragment>
                  ))}
                  {product.material && (
                    <>
                      <span className="font-semibold text-neutral-400 uppercase tracking-wider">Material</span>
                      <span className="text-neutral-600">{product.material}</span>
                    </>
                  )}
                  {product.fit && (
                    <>
                      <span className="font-semibold text-neutral-400 uppercase tracking-wider">Fit</span>
                      <span className="text-neutral-600">{product.fit}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STICKY BOTTOM BAR (MOBILE ONLY) */}
        <div className="lg:hidden fixed bottom-14 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-neutral-200 z-30 flex items-center gap-2.5 shadow-xl">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase">Price</span>
            <span className="text-base font-extrabold text-neutral-900 leading-tight">₹{product.salePrice}</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding || !isSelectedInStock}
            className={clsx(
              "flex-1 h-11 bg-white border border-neutral-900 text-neutral-900 font-bold uppercase tracking-wider text-[11px] rounded flex items-center justify-center gap-1.5 transition-colors",
              (!isSelectionComplete || !isSelectedInStock) && "opacity-50 cursor-not-allowed"
            )}
          >
            <ShoppingBag size={14} />
            <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
          </button>

          <button
            onClick={handleBuyNow}
            disabled={!isSelectedInStock}
            className={clsx(
              "flex-1 h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase tracking-wider text-[11px] rounded flex items-center justify-center transition-colors",
              (!isSelectionComplete || !isSelectedInStock) && "opacity-50 cursor-not-allowed"
            )}
          >
            Buy Now
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
