'use client';

import React from 'react';
import { useStore, TopLevelCategory } from '@/store/useStore';
import { Shirt, Cake } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';

interface CategorySwitchProps {
  className?: string;
}

export default function CategorySwitch({ className }: CategorySwitchProps) {
  const { category, setCategory } = useStore();
  const router = useRouter();

  const handleSwitch = (newCat: TopLevelCategory) => {
    setCategory(newCat);
    if (newCat === 'CAKES_AND_BAKES') {
      router.push('/cakes-and-bakes');
    } else {
      router.push('/');
    }
  };

  return (
    <div className={clsx("w-full py-2.5 bg-neutral-50/80 backdrop-blur-sm border-b border-neutral-200/60 sticky top-16 z-30 flex justify-center px-4", className)}>
      <div className="inline-flex items-center p-1 bg-neutral-200/60 rounded-full border border-neutral-300/40 w-full sm:w-auto max-w-sm sm:max-w-none">
        <button
          onClick={() => handleSwitch('FASHION')}
          className={clsx(
            "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-1.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all duration-200 cursor-pointer",
            category === 'FASHION'
              ? "bg-stone-900 text-white shadow-sm"
              : "text-neutral-600 hover:text-stone-900"
          )}
        >
          <Shirt size={13} />
          <span>Fashion</span>
        </button>

        <button
          onClick={() => handleSwitch('CAKES_AND_BAKES')}
          className={clsx(
            "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-1.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all duration-200 cursor-pointer",
            category === 'CAKES_AND_BAKES'
              ? "bg-emerald-800 text-white shadow-sm"
              : "text-neutral-600 hover:text-emerald-800"
          )}
        >
          <Cake size={13} />
          <span>Cakes & Bakes</span>
        </button>
      </div>
    </div>
  );
}
