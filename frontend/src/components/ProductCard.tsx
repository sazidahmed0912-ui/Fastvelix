'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Plus, Minus, Star, Sparkles } from 'lucide-react';
import { useStore, TopLevelCategory } from '@/store/useStore';
import { clsx } from 'clsx';

interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    slug: string;
    thumbnail: string;
    brand?: string;
    salePrice: number;
    basePrice: number;
    discount: number;
    ratings: { average: number; count: number };
    totalStock: number;
    topLevelCategory: TopLevelCategory;
    gender?: string;
    flavour?: string;
    isEggless?: boolean;
    productType?: string;
    fashionVariants?: { sku: string; size: string; color: string; stock: number }[];
    bakeryVariants?: { sku: string; size: string; unit: string; stock: number; price: number }[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { wishlist, toggleWishlist, addToCart, cart, updateCartQty } = useStore();
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);

  const isWishlisted = wishlist.some((item) => item.productId?._id === product._id);

  const defaultBakerySku = product.bakeryVariants?.[0]?.sku || `BAKE-${product._id.substring(0, 6)}`;
  const activeCartItem = cart?.items.find((item) => item.productId === product._id || (typeof item.productId === 'object' && item.productId?._id === product._id));

  const isInStock = product.totalStock > 0 || product.productType === 'CUSTOM_CAKE';

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!useStore.getState().user) {
      window.location.href = '/login';
      return;
    }
    try {
      await toggleWishlist(product._id);
    } catch (err: any) {
      if (err.status === 401 || err.code === 'AUTHENTICATION_REQUIRED') {
        window.location.href = '/login';
      }
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!useStore.getState().user) {
      window.location.href = '/login';
      return;
    }

    if (product.productType === 'CUSTOM_CAKE') {
      window.location.href = '/cakes-and-bakes/custom-cake';
      return;
    }
    
    if (product.topLevelCategory === 'FASHION') {
      if (!selectedSku) {
        setShowVariantSelector(true);
        return;
      }
      setIsAdding(true);
      try {
        await addToCart(product._id, selectedSku, 1);
        setShowVariantSelector(false);
      } catch (err: any) {
        alert(err.message || 'Failed to add item');
      } finally {
        setIsAdding(false);
      }
    } else {
      setIsAdding(true);
      try {
        await addToCart(product._id, defaultBakerySku, 1);
      } catch (err: any) {
        alert(err.message || 'Failed to add item');
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleQtyChange = async (e: React.MouseEvent, type: 'INC' | 'DEC') => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeCartItem) return;

    const currentQty = activeCartItem.quantity;
    const newQty = type === 'INC' ? currentQty + 1 : currentQty - 1;

    try {
      if (newQty <= 0) {
        await useStore.getState().removeFromCart(activeCartItem.sku);
      } else {
        await updateCartQty(activeCartItem.sku, newQty);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const categoryPath = product.topLevelCategory === 'CAKES_AND_BAKES' ? 'cakes-and-bakes' : 'fashion';
  const productUrl = `/${categoryPath}/${product.slug}`;
  const isFashion = product.topLevelCategory === 'FASHION';

  // ─── FASHION PRODUCT CARD (Editorial, Sharp, Minimal) ───
  if (isFashion) {
    return (
      <div className="group border border-neutral-200/70 bg-white flex flex-col justify-between hover:border-neutral-400 transition-all duration-200 relative rounded-sm overflow-hidden">
        
        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute left-2 top-2 z-10">
            <span className="bg-stone-900 text-white text-[9px] font-extrabold px-1.5 py-0.5 uppercase tracking-wider">
              -{product.discount}%
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label="Wishlist"
          className={clsx(
            "absolute right-2 top-2 p-1.5 bg-white/90 hover:bg-white text-neutral-400 hover:text-red-500 rounded-full z-10 transition-colors shadow-sm cursor-pointer",
            isWishlisted && "text-red-500 bg-white"
          )}
        >
          <Heart size={13} fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        {/* Product Image */}
        <Link href={productUrl} className="block relative aspect-[3/4] bg-stone-100 overflow-hidden">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
              No Image
            </div>
          )}
          
          {!isInStock && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
              <span className="bg-stone-900 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">Sold Out</span>
            </div>
          )}
        </Link>

        {/* Content Container */}
        <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 line-clamp-1">
              {product.brand || 'FASTVELIX'}
            </div>

            <Link href={productUrl} className="block text-xs font-bold text-stone-900 mt-0.5 hover:text-black line-clamp-2 leading-snug transition-colors">
              {product.title}
            </Link>

            <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-500">
              <Star size={10} fill="#eab308" className="text-yellow-500" />
              <span className="font-bold text-stone-900">{product.ratings?.average || '4.8'}</span>
              <span>({product.ratings?.count || 8})</span>
            </div>
          </div>

          {/* Price & Cart Trigger */}
          <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-extrabold text-stone-900">₹{product.salePrice.toLocaleString('en-IN')}</span>
              {product.discount > 0 && (
                <span className="text-[10px] text-neutral-400 line-through">₹{product.basePrice.toLocaleString('en-IN')}</span>
              )}
            </div>

            {isInStock && (
              <div>
                {activeCartItem ? (
                  <div className="flex items-center border border-stone-900 bg-white text-stone-900 h-6 rounded-none text-[10px]">
                    <button onClick={(e) => handleQtyChange(e, 'DEC')} className="px-1.5 h-full flex items-center justify-center hover:bg-neutral-100 cursor-pointer">
                      <Minus size={10} />
                    </button>
                    <span className="px-1.5 font-bold">{activeCartItem.quantity}</span>
                    <button onClick={(e) => handleQtyChange(e, 'INC')} className="px-1.5 h-full flex items-center justify-center hover:bg-neutral-100 cursor-pointer">
                      <Plus size={10} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="h-6 px-2.5 font-bold text-[10px] uppercase tracking-wider bg-stone-900 hover:bg-black text-white transition-colors cursor-pointer rounded-none flex items-center gap-1"
                  >
                    <span>{isAdding ? '...' : '+ Add'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── CAKES & BAKES PRODUCT CARD (Warm, Soft Rounded, Studio Bakery) ───
  return (
    <div className="group border border-amber-900/10 bg-white flex flex-col justify-between hover:border-emerald-800/40 hover:shadow-md transition-all duration-200 relative rounded-xl overflow-hidden">
      
      {/* Badges */}
      <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
        {product.isEggless && (
          <span className="bg-emerald-800/90 backdrop-blur-sm text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
            🟢 Eggless
          </span>
        )}
        {product.discount > 0 && (
          <span className="bg-rose-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
            -{product.discount}%
          </span>
        )}
      </div>

      {/* Wishlist toggle */}
      <button
        onClick={handleWishlist}
        aria-label="Wishlist"
        className={clsx(
          "absolute right-2 top-2 p-1.5 bg-white/90 hover:bg-white text-neutral-400 hover:text-red-500 rounded-full z-10 transition-colors shadow-sm cursor-pointer",
          isWishlisted && "text-red-500 bg-white"
        )}
      >
        <Heart size={13} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      {/* Product Image */}
      <Link href={productUrl} className="block relative aspect-[4/3] bg-amber-50/50 overflow-hidden p-1.5">
        <div className="w-full h-full rounded-lg overflow-hidden relative">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
              No Image
            </div>
          )}
          
          {!isInStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-stone-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Sold Out</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info Container */}
      <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
        <div>
          <div className="text-[9px] font-bold text-amber-800/80 tracking-wide line-clamp-1">
            {product.flavour ? `${product.flavour} • Customizable` : (product.brand || 'Artisanal Bake')}
          </div>

          <Link href={productUrl} className="block text-xs font-bold text-stone-900 font-serif mt-0.5 hover:text-emerald-800 line-clamp-2 leading-snug transition-colors">
            {product.title}
          </Link>

          <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-500">
            <Star size={10} fill="#eab308" className="text-yellow-500" />
            <span className="font-bold text-stone-900">{product.ratings?.average || '4.9'}</span>
            <span>({product.ratings?.count || 12})</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-1.5 border-t border-stone-100">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-extrabold text-stone-900">₹{product.salePrice.toLocaleString('en-IN')}</span>
            {product.discount > 0 && (
              <span className="text-[10px] text-neutral-400 line-through">₹{product.basePrice.toLocaleString('en-IN')}</span>
            )}
          </div>

          {isInStock && (
            <div>
              {product.productType === 'CUSTOM_CAKE' ? (
                <Link
                  href="/cakes-and-bakes/custom-cake"
                  className="h-6 px-2.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-full transition-colors"
                >
                  <Sparkles size={10} /> Design
                </Link>
              ) : activeCartItem ? (
                <div className="flex items-center border border-emerald-800 bg-white text-emerald-800 h-6 rounded-full text-[10px]">
                  <button onClick={(e) => handleQtyChange(e, 'DEC')} className="px-1.5 h-full flex items-center justify-center hover:bg-stone-50 cursor-pointer">
                    <Minus size={10} />
                  </button>
                  <span className="px-1.5 font-bold">{activeCartItem.quantity}</span>
                  <button onClick={(e) => handleQtyChange(e, 'INC')} className="px-1.5 h-full flex items-center justify-center hover:bg-stone-50 cursor-pointer">
                    <Plus size={10} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="h-6 px-2.5 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-full transition-colors cursor-pointer"
                >
                  <span>{isAdding ? '...' : '+ Add'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
