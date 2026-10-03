'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { MapPin, ShoppingBag, CreditCard, ChevronRight, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import Script from 'next/script';

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  label: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, clearCart } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Address, 2: Summary/Method, 3: Payment
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCart().finally(() => setCartLoading(false));
    loadAddresses();
  }, [fetchCart]);

  async function loadAddresses() {
    try {
      const data = await api.get<{ success: boolean; addresses: Address[] }>('/users/addresses');
      if (data.success && data.addresses.length > 0) {
        setAddresses(data.addresses);
        const defaultAddr = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
        setSelectedAddressId(defaultAddr._id);
      }
    } catch (err) {
      console.error('Failed to load user addresses:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddressConfirm = async () => {
    if (!selectedAddressId) {
      alert('Please select or add a delivery address.');
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    setIsProcessing(true);

    try {
      // 1. Pre-validate stock & address server-side
      const valRes = await api.post<{ success: boolean }>('/checkout/validate', {
        addressId: selectedAddressId,
      });

      if (!valRes.success) {
        throw new Error('Validation failed.');
      }

      // Generate a client-side idempotency key to prevent double checkout submissions
      const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // 2. Initiate order on backend
      const payRes = await api.post<{
        success: boolean;
        order: { _id: string; orderNumber: string; grandTotal: number };
        razorpayOrderId?: string;
        razorpayKeyId?: string;
      }>('/checkout/create-payment', {
        addressId: selectedAddressId,
        paymentMethod,
        idempotencyKey,
      });

      if (!payRes.success) {
        throw new Error('Failed to create order.');
      }

      const { order, razorpayOrderId, razorpayKeyId } = payRes;

      if (paymentMethod === 'COD') {
        // Direct order success for COD
        await clearCart();
        router.push(`/orders/${order._id}?success=true&method=cod`);
        return;
      }

      // Razorpay checkout configuration
      const options = {
        key: razorpayKeyId,
        amount: Math.round(order.grandTotal * 100),
        currency: 'INR',
        name: 'FastVelix',
        description: `Order Payment #${order.orderNumber}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          setIsProcessing(true);
          try {
            // Verify payment signature
            const verifyRes = await api.post<{ success: boolean; orderId: string }>(
              '/checkout/verify-payment',
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: order._id,
              }
            );

            if (verifyRes.success) {
              await clearCart();
              // Polling order status to wait until webhook marks it CONFIRMED
              router.push(`/orders/${order._id}?success=true`);
            } else {
              throw new Error('Payment verification failed.');
            }
          } catch (err: any) {
            alert(err.message || 'Signature verification error.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#16a34a',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            alert('Payment cancelled by user.');
          },
        },
      };

      if (typeof (window as any).Razorpay === 'function') {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback mock payment in development / when Razorpay script is unavailable
        const verifyRes = await api.post<{ success: boolean; orderId: string }>(
          '/checkout/verify-payment',
          {
            razorpayOrderId: razorpayOrderId || `order_mock_${Date.now()}`,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: 'mock_signature',
            orderId: order._id,
          }
        );

        if (verifyRes.success) {
          await clearCart();
          router.push(`/orders/${order._id}?success=true`);
        } else {
          throw new Error('Payment verification failed.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-neutral-400 animate-pulse">
          Loading your cart...
        </main>
        <Footer />
      </>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold">Your cart is empty.</h2>
          <p className="text-sm text-neutral-500 mt-2">Cannot check out with zero items.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-dark text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Go Back
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const selectedAddr = addresses.find((a) => a._id === selectedAddressId);

  return (
    <>
      <Header />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8 text-xs font-extrabold uppercase tracking-widest text-neutral-400">
          <span className={clsx(step === 1 ? "text-dark" : "text-neutral-400")}>1. Shipping Address</span>
          <ChevronRight size={12} />
          <span className={clsx(step === 2 ? "text-dark" : "text-neutral-400")}>2. Order Summary</span>
          <ChevronRight size={12} />
          <span className="text-neutral-400">3. Pay & Confirm</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
          
          {/* Main forms column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: Address select */}
            {step === 1 && (
              <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom space-y-6">
                <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100 flex items-center gap-2">
                  <MapPin size={16} className="text-brand" /> Select Shipping Address
                </h2>
                
                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-neutral-500 mb-4">No addresses found. Add an address to continue.</p>
                    <button
                      onClick={() => router.push('/account/addresses')}
                      className="px-4 py-2 border border-dark text-dark font-bold text-xs uppercase cursor-pointer"
                    >
                      Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr._id}
                        onClick={() => setSelectedAddressId(addr._id)}
                        className={clsx(
                          "flex items-start gap-3 p-4 border cursor-pointer hover:border-dark transition-colors",
                          selectedAddressId === addr._id ? "border-dark bg-neutral-50" : "border-neutral-200"
                        )}
                      >
                        <input
                          type="radio"
                          name="checkout_address"
                          checked={selectedAddressId === addr._id}
                          readOnly
                          className="accent-dark mt-1"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] bg-neutral-100 px-1 py-0.5">{addr.label}</span>
                          <h4 className="font-bold text-sm text-dark mt-1">{addr.fullName}</h4>
                          <p className="text-neutral-500 mt-1">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-neutral-500 mt-0.5">Phone: {addr.phone}</p>
                        </div>
                      </label>
                    ))}

                    <div className="pt-4 flex justify-between items-center border-t border-neutral-100">
                      <button
                        onClick={() => router.push('/account/addresses')}
                        className="text-xs font-bold text-brand hover:underline cursor-pointer"
                      >
                        + Add or Manage Addresses
                      </button>
                      <button
                        onClick={handleAddressConfirm}
                        className="h-10 px-6 bg-dark hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Deliver to this Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Summary / Payment method */}
            {step === 2 && (
              <div className="space-y-6">
                
                {/* Selected Address Display */}
                <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400">Shipping Details</h3>
                    <button onClick={() => setStep(1)} className="text-xs font-bold text-brand hover:underline">Change</button>
                  </div>
                  {selectedAddr && (
                    <div className="text-xs">
                      <h4 className="font-bold text-sm">{selectedAddr.fullName}</h4>
                      <p className="text-neutral-500 mt-1">{selectedAddr.addressLine1}, {selectedAddr.city}, {selectedAddr.state} - {selectedAddr.pincode}</p>
                      <p className="text-neutral-500 mt-0.5">Phone: {selectedAddr.phone}</p>
                    </div>
                  )}
                </div>

                {/* Payment Option select */}
                <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom space-y-4">
                  <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100 flex items-center gap-2">
                    <CreditCard size={16} className="text-brand" /> Payment Method
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label
                      onClick={() => setPaymentMethod('RAZORPAY')}
                      className={clsx(
                        "flex items-center gap-3 p-4 border cursor-pointer hover:border-brand transition-colors",
                        paymentMethod === 'RAZORPAY' ? "border-brand bg-brand-light/30" : "border-neutral-200"
                      )}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'RAZORPAY'}
                        readOnly
                        className="accent-brand"
                      />
                      <div className="text-xs">
                        <h4 className="font-bold text-dark text-sm">Online Razorpay / Card</h4>
                        <p className="text-neutral-500 mt-0.5">Pay via Cards, UPI, Netbanking safely.</p>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentMethod('COD')}
                      className={clsx(
                        "flex items-center gap-3 p-4 border cursor-pointer hover:border-neutral-500 transition-colors",
                        paymentMethod === 'COD' ? "border-dark bg-neutral-50" : "border-neutral-200"
                      )}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'COD'}
                        readOnly
                        className="accent-dark"
                      />
                      <div className="text-xs">
                        <h4 className="font-bold text-dark text-sm">Cash on Delivery (COD)</h4>
                        <p className="text-neutral-500 mt-0.5">Pay in cash directly upon physical delivery.</p>
                      </div>
                    </label>
                  </div>

                  {errorMsg && (
                    <p className="p-3 bg-red-50 text-red-600 text-xs font-semibold border-l-4 border-red-500">{errorMsg}</p>
                  )}

                  <div className="pt-4 flex justify-between items-center border-t border-neutral-100">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-neutral-500 hover:text-dark uppercase tracking-wider cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      className={clsx(
                        "h-12 px-8 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors",
                        paymentMethod === 'RAZORPAY' ? "bg-brand hover:bg-brand-hover" : "bg-dark hover:bg-neutral-800",
                        isProcessing && "opacity-50"
                      )}
                    >
                      <span>{isProcessing ? 'Processing...' : paymentMethod === 'RAZORPAY' ? 'Initiate Payment' : 'Confirm Order'}</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* Checkout Totals / Order summary side card */}
          <div className="bg-white border border-neutral-200 p-6 shadow-sm-custom space-y-6 shrink-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100 flex items-center gap-2">
              <ShoppingBag size={14} className="text-brand" /> Order Items ({cart.items.length})
            </h3>
            
            <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.sku} className="py-2.5 flex justify-between gap-3 text-xs">
                  <div className="flex gap-2">
                    <img src={item.thumbnail} className="w-8 h-10 object-cover" alt="" />
                    <div>
                      <span className="font-bold text-dark block line-clamp-1">{item.title}</span>
                      <span className="text-neutral-500">Qty: {item.quantity} | {item.size || item.weight || item.flavour || 'Standard'}</span>
                    </div>
                  </div>
                  <span className="font-semibold">{item.totalPrice}</span>
                </div>
              ))}
            </div>

            {/* Billing breakdown */}
            <div className="pt-4 border-t border-neutral-200 text-xs space-y-2 text-neutral-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-dark font-medium">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {cart.couponDiscount > 0 && (
                <div className="flex justify-between text-brand font-semibold">
                  <span>Coupon Discount ({cart.couponCode})</span>
                  <span>-₹{cart.couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Tax (5% GST)</span>
                <span className="text-dark font-medium">₹{cart.tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Handling</span>
                <span className="text-dark font-medium">
                  {cart.shippingFee === 0 ? <span className="text-brand font-semibold">FREE</span> : `₹${cart.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-dark font-extrabold text-sm pt-3 border-t border-neutral-100">
                <span>Total Amount Due</span>
                <span>₹{cart.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Safe trust badges */}
            <div className="bg-neutral-50 p-4 space-y-2 border border-neutral-200 text-[10px] text-neutral-400">
              <div className="flex items-center gap-1.5 font-bold text-neutral-600">
                <ShieldCheck size={14} className="text-brand" /> SSL Encrypted Checkout
              </div>
              <p>Your payment data is fully tokensied & routed via Razorpay PCI-DSS certified gateways.</p>
            </div>
          </div>

        </div>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </main>
      <Footer />
    </>
  );
}
