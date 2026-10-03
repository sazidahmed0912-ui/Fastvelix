'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Heart, Trash2, ShoppingCart, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function WishlistPage() {
  const { user, wishlist, fetchWishlist, toggleWishlist } = useStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = (productId: string) => {
    toggleWishlist(productId);
  };

  const isWishlistEmpty = wishlist.length === 0;

  return (
      <div className="space-y-1">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider mb-6">
          <span>Home</span>
          <ChevronRight size={12} />
          <span>Account</span>
          <ChevronRight size={12} />
          <span className="text-dark">My Wishlist</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-8 uppercase">My Wishlist</h1>

        {isWishlistEmpty ? (
          <div className="text-center py-20 border border-neutral-100 bg-white shadow-sm-custom flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-neutral-50 rounded-full text-neutral-400">
              <Heart size={48} />
            </div>
            <h2 className="text-lg font-bold text-dark">Your wishlist is empty</h2>
            <p className="text-sm text-neutral-500 max-w-xs">
              Save your favorite fashion trends and bakery treats to buy them later.
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex items-center justify-center bg-dark text-white text-xs font-bold uppercase tracking-wider px-6 py-3 hover:bg-neutral-800 transition-colors"
            >
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const product = item.productId;
              if (!product) return null;

              const detailUrl = `/${product.status === 'ACTIVE' ? 'fashion' : 'cakes-and-bakes'}/${product.slug}`;

              return (
                <div
                  key={product._id}
                  className="group border border-neutral-100 bg-white flex flex-col justify-between hover-lift shadow-sm-custom relative"
                >
                  {/* Remove trigger */}
                  <button
                    onClick={() => handleRemove(product._id)}
                    className="absolute right-3 top-3 p-2 bg-white/80 hover:bg-white text-neutral-400 hover:text-red-500 rounded-full z-10 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>

                  {/* Image */}
                  <Link href={detailUrl} className="block relative aspect-square bg-neutral-50 overflow-hidden">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <h3 className="block text-sm font-bold text-dark hover:text-brand line-clamp-2">
                        <Link href={detailUrl}>{product.title}</Link>
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-sm font-extrabold text-dark">₹{product.salePrice}</span>
                        {product.discount > 0 && (
                          <span className="text-xs text-neutral-400 line-through">₹{product.basePrice}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-neutral-50 pt-3">
                      <Link
                        href={detailUrl}
                        className="w-full h-9 bg-dark hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShoppingCart size={12} />
                        <span>Move to Cart</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
}
