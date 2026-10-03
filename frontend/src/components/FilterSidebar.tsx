'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';
import { TopLevelCategory } from '@/store/useStore';
import { clsx } from 'clsx';

interface FilterSidebarProps {
  category?: TopLevelCategory;
  type?: TopLevelCategory;
  onClose?: () => void;
  onFilterChange?: (filters: any) => void;
  brands?: string[];
}

export default function FilterSidebar({ category, type, onClose, onFilterChange, brands = [] }: FilterSidebarProps) {
  const activeCategory = category || type || 'CAKES_AND_BAKES';
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  
  // Fashion state
  const [gender, setGender] = useState(searchParams.get('gender') || '');
  const [size, setSize] = useState(searchParams.get('size') || '');

  // Cakes & Bakes state
  const [flavour, setFlavour] = useState(searchParams.get('flavour') || '');
  const [isEggless, setIsEggless] = useState(searchParams.get('isEggless') || '');

  const applyFilters = () => {
    const filterObj: any = {};

    if (minPrice) filterObj.minPrice = minPrice;
    if (maxPrice) filterObj.maxPrice = maxPrice;
    if (selectedBrand) filterObj.brand = selectedBrand;

    if (activeCategory === 'FASHION') {
      if (gender) filterObj.gender = gender;
      if (size) filterObj.size = size;
    } else {
      if (flavour) filterObj.flavour = flavour;
      if (isEggless) filterObj.isEggless = isEggless;
    }

    if (onFilterChange) {
      onFilterChange(filterObj);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      Object.keys(filterObj).forEach((k) => params.set(k, filterObj[k]));
      router.push(`?${params.toString()}`);
    }

    if (onClose) onClose();
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrand('');
    setGender('');
    setSize('');
    setFlavour('');
    setIsEggless('');

    if (onFilterChange) {
      onFilterChange({});
    } else {
      router.push('?');
    }
    if (onClose) onClose();
  };

  const fashionSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
  const cakeFlavours = ['Belgian Chocolate', 'Red Velvet', 'Vanilla Bean', 'Black Forest', 'Butterscotch', 'Pineapple'];

  return (
    <div className="w-full bg-white flex flex-col gap-6 p-5 rounded-xl border border-stone-200">
      <div className="flex justify-between items-center pb-4 border-b border-stone-100">
        <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5 text-stone-900">
          <Filter size={16} /> Filters
        </h3>
        <button onClick={clearFilters} className="text-xs font-semibold text-stone-400 hover:text-stone-900">
          Clear All
        </button>
      </div>

      {activeCategory === 'FASHION' ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Gender</h4>
            <div className="flex flex-col gap-2 text-sm">
              {['MEN', 'WOMEN', 'KIDS', 'UNISEX'].map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer font-medium text-stone-600 hover:text-stone-950">
                  <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Sizes</h4>
            <div className="flex flex-wrap gap-1.5">
              {fashionSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(size === s ? '' : s)}
                  className={clsx("px-2.5 py-1 text-xs border font-semibold", size === s ? "bg-black text-white" : "bg-white text-stone-800")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Flavour</h4>
            <div className="flex flex-col gap-2 text-sm">
              {cakeFlavours.map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer font-medium text-stone-600 hover:text-stone-950">
                  <input type="radio" name="flavour" checked={flavour === f} onChange={() => setFlavour(f)} />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Dietary Option</h4>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-600 hover:text-stone-950 text-sm">
              <input
                type="checkbox"
                checked={isEggless === 'true'}
                onChange={(e) => setIsEggless(e.target.checked ? 'true' : '')}
                className="accent-emerald-800"
              />
              <span>🟢 100% Eggless Only</span>
            </label>
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Price Range (₹)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full h-9 px-2 border border-stone-200 text-sm text-center"
          />
          <span className="text-stone-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full h-9 px-2 border border-stone-200 text-sm text-center"
          />
        </div>
      </div>

      <button
        onClick={applyFilters}
        className="w-full h-10 font-bold text-xs uppercase tracking-wider text-white bg-emerald-800 hover:bg-emerald-700 transition-colors cursor-pointer"
      >
        Apply Filters
      </button>
    </div>
  );
}
