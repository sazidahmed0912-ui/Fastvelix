'use client';

import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="border border-neutral-100 bg-white flex flex-col gap-4 p-2 animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="aspect-square bg-neutral-100 w-full" />
      
      {/* Text Details placeholders */}
      <div className="px-2 pb-4 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-neutral-100 w-1/3" />
          <div className="h-4 bg-neutral-100 w-3/4" />
          <div className="h-3 bg-neutral-100 w-1/4" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-neutral-100 w-1/4" />
          <div className="h-8 bg-neutral-100 w-1/3" />
        </div>
      </div>
    </div>
  );
}
