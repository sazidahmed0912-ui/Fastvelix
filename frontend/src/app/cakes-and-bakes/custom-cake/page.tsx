'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategorySwitch from '@/components/CategorySwitch';
import { useStore } from '@/store/useStore';
import { api } from '@/utils/api';
import { useRouter } from 'next/navigation';
import {
  Cake,
  CheckCircle2,
  Upload,
  Calendar,
  Clock,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';

export default function CustomCakeDesignerPage() {
  const router = useRouter();
  const { addToCart } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Available Options from API
  const [sizes, setSizes] = useState<any[]>([]);
  const [flavours, setFlavours] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [toppers, setToppers] = useState<any[]>([]);

  // User Selections
  const [selectedSize, setSelectedSize] = useState('0.5 kg');
  const [selectedFlavour, setSelectedFlavour] = useState('Belgian Chocolate Truffle');
  const [selectedStyle, setSelectedStyle] = useState('Minimalist Pastel');
  const [selectedColour, setSelectedColour] = useState('Pastel Pink & Cream');
  const [messageOnCake, setMessageOnCake] = useState('Happy Birthday!');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedTopper, setSelectedTopper] = useState('Happy Birthday (Gold Acrylic)');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('12:00 PM – 02:00 PM');

  // Available Dates & Slots
  const [availableDates, setAvailableDates] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  // Dynamic Quote
  const [quote, setQuote] = useState<any>({
    basePrice: 799,
    customizationPrice: 150,
    subtotal: 949,
    deliveryFee: 0,
    total: 949,
  });

  // Fetch Options & Dates
  useEffect(() => {
    async function loadData() {
      try {
        const [optRes, dateRes] = await Promise.all([
          api.get<{ success: boolean; options: any }>('/cake-options'),
          api.get<{ success: boolean; availableDates: any[] }>('/delivery/availability?preparationHours=24'),
        ]);

        if (optRes.success) {
          setSizes(optRes.options.sizes);
          setFlavours(optRes.options.flavours);
          setStyles(optRes.options.styles);
          setToppers(optRes.options.toppers);
        }

        if (dateRes.success && dateRes.availableDates.length > 0) {
          setAvailableDates(dateRes.availableDates);
          setSelectedDate(dateRes.availableDates[0].date);
        }
      } catch (err) {
        console.error('Failed to load cake options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadData();
  }, []);

  // Fetch Time Slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    async function loadSlots() {
      try {
        const res = await api.get<{ success: boolean; slots: any[] }>(`/delivery/slots?date=${selectedDate}`);
        if (res.success) {
          setAvailableSlots(res.slots);
          const firstAvailable = res.slots.find((s) => s.available);
          if (firstAvailable) setSelectedSlot(firstAvailable.slotTime);
        }
      } catch (err) {
        console.error('Failed to load delivery slots:', err);
      }
    }
    loadSlots();
  }, [selectedDate]);

  // Recalculate Quote from Server when selections change
  useEffect(() => {
    async function fetchServerQuote() {
      try {
        const res = await api.post<{ success: boolean; quote: any }>('/custom-cakes/quote', {
          size: selectedSize,
          flavour: selectedFlavour,
          style: selectedStyle,
          topper: selectedTopper,
          photoRequired: Boolean(photoUrl),
        });

        if (res.success) {
          setQuote(res.quote);
        }
      } catch (err) {
        console.error('Failed to calculate server quote:', err);
      }
    }
    fetchServerQuote();
  }, [selectedSize, selectedFlavour, selectedStyle, selectedTopper, photoUrl]);

  // Handle Photo File Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Photo must be less than 10MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/custom-cakes/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setPhotoUrl(data.photoUrl);
      } else {
        alert(data.message || 'Photo upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Photo upload failed.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddToCart = async () => {
    setSubmitting(true);
    try {
      // Fetch or use default custom cake product ID
      const customProductRes = await api.get<{ success: boolean; products: any[] }>('/products?topLevelCategory=CAKES_AND_BAKES&limit=10');
      let customProduct = customProductRes.products?.find((p) => p.productType === 'CUSTOM_CAKE') || customProductRes.products?.[0];

      const cakeConfig = {
        size: selectedSize,
        flavour: selectedFlavour,
        style: selectedStyle,
        colour: selectedColour,
        message: messageOnCake,
        photoUrl: photoUrl || undefined,
        topper: selectedTopper,
        deliveryDate: selectedDate,
        deliverySlot: selectedSlot,
        additionalNotes: additionalNotes || undefined,
        customPrice: quote.total,
      };

      await addToCart(
        customProduct?._id || '65f1234567890abcdef12345',
        `CUSTOM-${Date.now().toString(36).toUpperCase()}`,
        1,
        cakeConfig
      );

      router.push('/cart');
    } catch (err: any) {
      console.error('Failed to add custom cake to cart:', err);
      alert(err.message || 'Failed to add custom cake to cart.');
    } finally {
      setSubmitting(false);
    }
  };

  const colors = [
    'Pastel Pink & Cream',
    'Royal Gold & White',
    'Deep Belgian Chocolate',
    'Mint Green & Gold',
    'Lavender & Pearl',
    'Sky Blue & Silver',
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Header />
      <CategorySwitch />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Cake size={14} /> Interactive Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">Custom Cake Designer</h1>
          <p className="text-stone-600 text-sm mt-1">Design your custom cake step-by-step with instant live pricing.</p>
        </div>

        {/* Step Progress Tracker */}
        <div className="overflow-x-auto pb-4 mb-8">
          <div className="flex items-center justify-between min-w-[700px] border-b border-stone-200 pb-4">
            {[
              '1. Size',
              '2. Flavour',
              '3. Style',
              '4. Colour',
              '5. Message',
              '6. Photo',
              '7. Topper',
              '8. Notes',
              '9. Delivery',
              '10. Summary',
            ].map((stepName, idx) => {
              const stepNum = idx + 1;
              const isActive = currentStep === stepNum;
              const isDone = currentStep > stepNum;

              return (
                <button
                  key={stepNum}
                  onClick={() => setCurrentStep(stepNum)}
                  className={`flex flex-col items-center text-xs font-medium cursor-pointer transition-colors ${
                    isActive
                      ? 'text-emerald-800 font-bold'
                      : isDone
                      ? 'text-stone-700'
                      : 'text-stone-400'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs mb-1 font-bold ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : isDone
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span>{stepName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Designer Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Interactive Step Controls */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-sm space-y-6">
            {/* STEP 1: SIZE */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 1 — Select Cake Size</h3>
                <p className="text-stone-500 text-sm">Choose the size based on your guest count.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {sizes.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedSize(s.name)}
                      className={`p-4 border text-left rounded-lg transition-all cursor-pointer ${
                        selectedSize === s.name
                          ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold text-stone-900">
                        <span>{s.name}</span>
                        <span className="text-xs text-emerald-800 font-semibold">
                          {s.extraPrice === 0 ? 'Base' : `+₹${s.extraPrice}`}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">Serves: {s.servings}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: FLAVOUR */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 2 — Select Sponge & Flavour</h3>
                <p className="text-stone-500 text-sm">Baked fresh with Belgian chocolate, premium cocoa & natural fruits.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {flavours.map((f) => (
                    <button
                      key={f._id}
                      onClick={() => setSelectedFlavour(f.name)}
                      className={`p-4 border text-left rounded-lg transition-all cursor-pointer ${
                        selectedFlavour === f.name
                          ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold text-stone-900">
                        <span>{f.name}</span>
                        <span className="text-xs text-emerald-800 font-semibold">
                          {f.extraPrice === 0 ? 'Included' : `+₹${f.extraPrice}`}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{f.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: STYLE */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 3 — Select Cake Theme & Style</h3>
                <p className="text-stone-500 text-sm">Handcrafted finish and frosting style.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {styles.map((st) => (
                    <button
                      key={st._id}
                      onClick={() => setSelectedStyle(st.name)}
                      className={`p-4 border text-left rounded-lg transition-all cursor-pointer ${
                        selectedStyle === st.name
                          ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold text-stone-900">
                        <span>{st.name}</span>
                        <span className="text-xs text-emerald-800 font-semibold">
                          {st.extraPrice === 0 ? 'Standard' : `+₹${st.extraPrice}`}
                        </span>
                      </div>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded">
                        {st.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: COLOUR */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 4 — Select Colour Palette</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColour(c)}
                      className={`p-4 border text-left rounded-lg font-medium transition-all cursor-pointer ${
                        selectedColour === c
                          ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20 text-emerald-950 font-bold'
                          : 'border-stone-200 hover:border-stone-400 text-stone-800'
                      }`}
                    >
                      🎨 {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: MESSAGE */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 5 — Custom Message on Cake</h3>
                <p className="text-stone-500 text-sm">Piped in chocolate/icing on top of the cake.</p>
                <div className="pt-2">
                  <input
                    type="text"
                    maxLength={35}
                    value={messageOnCake}
                    onChange={(e) => setMessageOnCake(e.target.value)}
                    placeholder="e.g. Happy Birthday Sarah!"
                    className="w-full p-4 border border-stone-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                  <div className="flex justify-between text-xs text-stone-400 mt-2">
                    <span>Example: Happy Birthday Alex, 30th Anniversary!</span>
                    <span>{messageOnCake.length} / 35 characters</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: PHOTO UPLOAD */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 6 — Photo Image Upload (Optional)</h3>
                <p className="text-stone-500 text-sm">Upload a reference photo for edible photo print or design reference.</p>
                <div className="border-2 border-dashed border-stone-300 p-6 rounded-lg text-center space-y-4 bg-stone-50">
                  {photoUrl ? (
                    <div className="space-y-2">
                      <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${photoUrl}`} alt="Reference Upload" className="h-40 mx-auto object-cover rounded-lg shadow-sm" />
                      <p className="text-xs text-emerald-700 font-bold">Photo Uploaded Successfully! (+₹200)</p>
                      <button onClick={() => setPhotoUrl('')} className="text-xs text-rose-600 underline">Remove Photo</button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto text-stone-400 mb-2" size={32} />
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded hover:bg-stone-800">
                        {uploadingPhoto ? 'Uploading...' : 'Choose Reference Image'}
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      <p className="text-xs text-stone-400 mt-2">JPEG, PNG, WEBP max 10MB (+₹200 for photo print customization)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 7: TOPPER */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 7 — Cake Topper</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {toppers.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => setSelectedTopper(t.name)}
                      className={`p-4 border text-left rounded-lg transition-all cursor-pointer ${
                        selectedTopper === t.name
                          ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20 font-bold'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex justify-between items-center text-stone-900">
                        <span>{t.name}</span>
                        <span className="text-xs text-emerald-800 font-semibold">
                          {t.extraPrice === 0 ? 'Included' : `+₹${t.extraPrice}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: NOTES */}
            {currentStep === 8 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 8 — Additional Instructions for Baker</h3>
                <textarea
                  rows={4}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Less sugar frosting, extra dark chocolate drizzle, please pack in gift box..."
                  className="w-full p-4 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            )}

            {/* STEP 9: DELIVERY DATE & SLOT */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Step 9 — Select Delivery Date & Time Slot</h3>
                  <p className="text-stone-500 text-sm">Cakes require 24 hours preparation time for fresh baking.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Available Delivery Date</label>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {availableDates.map((d) => (
                      <button
                        key={d.date}
                        onClick={() => setSelectedDate(d.date)}
                        className={`px-4 py-3 border text-center rounded-lg min-w-[100px] transition-all cursor-pointer ${
                          selectedDate === d.date
                            ? 'border-emerald-800 bg-emerald-800 text-white font-bold'
                            : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                        }`}
                      >
                        <div className="text-xs uppercase opacity-80">{d.dayOfWeek}</div>
                        <div className="text-sm font-bold mt-1">{d.formattedDate}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Time Slot</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.slotTime}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.slotTime)}
                        className={`p-3 border rounded-lg text-xs font-semibold flex justify-between items-center transition-all cursor-pointer ${
                          selectedSlot === slot.slotTime
                            ? 'border-emerald-800 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-800/20'
                            : slot.available
                            ? 'border-stone-200 hover:border-stone-400 text-stone-800'
                            : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        <span><Clock size={14} className="inline mr-1" /> {slot.slotTime}</span>
                        <span>{slot.available ? 'Available' : 'Full'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 10: SUMMARY */}
            {currentStep === 10 && (
              <div className="space-y-6">
                <h3 className="text-xl font-serif font-bold text-stone-900">Step 10 — Review Your Custom Order</h3>
                <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-stone-200">
                    <span className="text-stone-500">Size:</span>
                    <span className="font-bold">{selectedSize}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200">
                    <span className="text-stone-500">Flavour:</span>
                    <span className="font-bold">{selectedFlavour}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200">
                    <span className="text-stone-500">Style & Theme:</span>
                    <span className="font-bold">{selectedStyle}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200">
                    <span className="text-stone-500">Colour Palette:</span>
                    <span className="font-bold">{selectedColour}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200">
                    <span className="text-stone-500">Message on Cake:</span>
                    <span className="font-bold italic text-emerald-900">"{messageOnCake}"</span>
                  </div>
                  {photoUrl && (
                    <div className="flex justify-between py-1 border-b border-stone-200">
                      <span className="text-stone-500">Photo Attachment:</span>
                      <span className="font-bold text-emerald-700">Yes (+₹200)</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-stone-200">
                    <span className="text-stone-500">Topper:</span>
                    <span className="font-bold">{selectedTopper}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200">
                    <span className="text-stone-500">Delivery Date & Slot:</span>
                    <span className="font-bold">{selectedDate} ({selectedSlot})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-stone-200">
              <button
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-6 py-3 border border-stone-300 text-stone-700 text-sm font-semibold rounded hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={16} /> Back
              </button>

              {currentStep < 10 ? (
                <button
                  onClick={() => setCurrentStep((prev) => Math.min(10, prev + 1))}
                  className="px-8 py-3 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold rounded flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={handleAddToCart}
                  className="px-8 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 text-sm font-bold uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <ShoppingBag size={18} />
                  {submitting ? 'Adding...' : `Add Custom Cake — ₹${quote.total}`}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Live Interactive Cake Card Summary */}
          <div className="bg-stone-900 text-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6 h-fit sticky top-24">
            <div className="flex justify-between items-center border-b border-stone-800 pb-4">
              <h3 className="font-serif font-bold text-lg text-amber-200">Live Quote Summary</h3>
              <span className="px-2.5 py-0.5 bg-emerald-900/80 text-emerald-300 text-[10px] font-bold uppercase rounded">
                Server Authoritative
              </span>
            </div>

            {/* Cake Graphic Representation */}
            <div className="bg-stone-800/80 p-6 rounded-lg text-center space-y-3 border border-stone-700">
              <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-tr from-amber-800 via-amber-600 to-amber-400 flex items-center justify-center text-stone-950 font-bold shadow-inner">
                <Cake size={48} />
              </div>
              <p className="font-serif font-bold text-stone-200">{selectedFlavour}</p>
              <p className="text-xs text-stone-400">{selectedSize} • {selectedStyle}</p>
              {messageOnCake && (
                <div className="px-3 py-1.5 bg-stone-900 text-amber-300 text-xs italic font-serif rounded">
                  "{messageOnCake}"
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs text-stone-300 border-t border-stone-800 pt-4">
              <div className="flex justify-between">
                <span>Base Cake (0.5kg):</span>
                <span>₹{quote.basePrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Customization Addons:</span>
                <span>+₹{quote.customizationPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery Fee:</span>
                <span>{quote.deliveryFee === 0 ? 'FREE' : `+₹${quote.deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white border-t border-stone-800 pt-3">
                <span>Total Amount:</span>
                <span className="text-amber-300">₹{quote.total}</span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={submitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ShoppingBag size={18} />
              Add to Cart — ₹{quote.total}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
