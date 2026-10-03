'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useStore } from '@/store/useStore';
import { Trash2, ShoppingBag, Plus, Minus, Tag, ShieldCheck, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function CartPage() {
  const router = useRouter();
  const {
    user,
    cart,
    fetchCart,
    updateCartQty,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart
  } = useStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [updatingSku, setUpdatingSku] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQtyChange = async (sku: string, currentQty: number, type: 'INC' | 'DEC') => {
    setUpdatingSku(sku);
    const newQty = type === 'INC' ? currentQty + 1 : currentQty - 1;
    try {
      if (newQty <= 0) {
        await removeFromCart(sku);
      } else {
        await updateCartQty(sku, newQty);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating quantity.');
    } finally {
      setUpdatingSku(null);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <h1 className="text-2xl font-bold tracking-tight mb-8 uppercase">Shopping Cart</h1>

        {isCartEmpty ? (
          <div className="text-center py-20 border border-neutral-100 bg-white shadow-sm-custom flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-neutral-50 rounded-full text-neutral-400">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-lg font-bold text-dark">Your cart is empty</h2>
            <p className="text-sm text-neutral-500 max-w-xs">
              Fill it with artisanal celebration cakes, gourmet pastries, and curated fashion apparel.
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex items-center justify-center bg-dark text-white text-xs font-bold uppercase tracking-wider px-6 py-3 hover:bg-neutral-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
            
            {/* Column 1: Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.sku}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-neutral-100 bg-white p-4 gap-4 shadow-sm-custom"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex gap-4">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-20 h-24 sm:w-24 sm:h-28 object-cover border border-neutral-100 shrink-0 bg-neutral-50"
                    />
                    <div className="flex flex-col justify-between py-1">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-none w-fit">
                          {item.topLevelCategory}
                        </span>
                        <h3 className="font-bold text-sm text-dark mt-1 hover:text-brand line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 text-xs text-neutral-500 mt-1">
                          {item.size && <span>Size: <strong className="text-dark">{item.size}</strong></span>}
                          {item.color && <span>Color: <strong className="text-dark">{item.color}</strong></span>}
                          {item.flavour && <span>Flavour: <strong className="text-dark">{item.flavour}</strong></span>}
                          {item.weight && <span>Weight: <strong className="text-dark">{item.weight}</strong></span>}
                          {item.isEggless && <span className="text-emerald-700 font-semibold">Eggless</span>}
                          {item.cakeConfiguration?.message && (
                            <span className="block w-full text-[11px] text-amber-800 italic mt-0.5">
                              Message: "{item.cakeConfiguration.message}"
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs font-bold text-dark mt-2">
                        ₹{item.unitPrice.toLocaleString('en-IN')} each
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity controls & Total */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-none pt-4 sm:pt-0 gap-4">
                    {/* Qty Controls */}
                    <div className="flex items-center border border-neutral-200 bg-white h-9">
                      <button
                        onClick={() => handleQtyChange(item.sku, item.quantity, 'DEC')}
                        disabled={updatingSku === item.sku}
                        className="px-3 h-full hover:bg-neutral-50 flex items-center justify-center cursor-pointer border-r border-neutral-200"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-3 text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(item.sku, item.quantity, 'INC')}
                        disabled={updatingSku === item.sku}
                        className="px-3 h-full hover:bg-neutral-50 flex items-center justify-center cursor-pointer border-l border-neutral-200"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Total Price */}
                    <div className="flex flex-col items-end">
                      <span className="font-extrabold text-sm">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => removeFromCart(item.sku)}
                        className="text-neutral-400 hover:text-red-500 text-xs flex items-center gap-1.5 mt-2 cursor-pointer"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={clearCart}
                  className="text-xs text-neutral-400 hover:text-dark font-bold uppercase tracking-wider cursor-pointer"
                >
                  Clear Shopping Cart
                </button>
                <Link href="/" className="text-xs text-brand hover:underline font-bold uppercase tracking-wider">
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Column 2: Cart Summary */}
            <div className="space-y-6">
              
              {/* Promo Coupon Card */}
              <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom">
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-1.5">
                  <Tag size={14} className="text-brand" /> Apply Promo Code
                </h3>
                
                {cart.couponCode ? (
                  <div className="flex items-center justify-between bg-brand-light border border-brand/20 p-3">
                    <div className="text-xs">
                      <span className="font-extrabold text-brand uppercase">{cart.couponCode}</span> applied!
                      <p className="text-[10px] text-brand/80 mt-0.5">Saved ₹{cart.couponDiscount.toLocaleString('en-IN')}</p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="h-10 px-3 border border-neutral-300 focus:outline-none focus:border-dark text-xs uppercase flex-grow"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="bg-dark text-white px-4 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-500 font-medium mt-2">{couponError}</p>
                )}
              </div>

              {/* Bill Details */}
              <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100">
                  Bill Summary
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span className="text-dark font-medium">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {cart.couponDiscount > 0 && (
                    <div className="flex justify-between text-brand font-semibold">
                      <span>Promo Discount</span>
                      <span>-₹{cart.couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-500">
                    <span>Estimated Tax (5% GST)</span>
                    <span className="text-dark font-medium">₹{cart.tax.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-neutral-500">
                    <span>Shipping Fee</span>
                    <span className="text-dark font-medium">
                      {cart.shippingFee === 0 ? (
                        <span className="text-brand font-bold uppercase text-xs">FREE</span>
                      ) : (
                        `₹${cart.shippingFee}`
                      )}
                    </span>
                  </div>
                  
                  {cart.shippingFee > 0 && (
                    <p className="text-[10px] text-neutral-400 bg-neutral-50 p-2 border border-dashed border-neutral-200">
                      Add ₹{(499 - cart.subtotal).toLocaleString('en-IN')} more to unlock <strong>FREE DELIVERY</strong>.
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-neutral-100 font-extrabold text-base">
                  <span>Grand Total</span>
                  <span className="text-dark">₹{cart.grandTotal.toLocaleString('en-IN')}</span>
                </div>

                <button
                  onClick={() => {
                    if (!user) {
                      router.push('/login?redirect=/checkout');
                    } else {
                      router.push('/checkout');
                    }
                  }}
                  className="w-full h-12 bg-dark hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>

          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
