'use client';

/**
 * ══════════════════════════════════════════════════════════════
 * ⚡ FASTVELIX — SHOP BY CATEGORY (square icon row)
 * Layout adapted from the Fzokart reference project
 * (frontend-next/app/_pages/HomePage.tsx → CategoryIconItem +
 *  MobileCategoryCarousel).
 *
 * Behaviour:
 *  • Centred uppercase heading with responsive sizing.
 *  • Desktop → single justified non-wrapping row of square icons.
 *  • Mobile → horizontal snap carousel, exactly 4 icons per page.
 *  • Square white tile with border + hover shadow lift.
 *  • Image fills the tile edge to edge (object-cover, no padding).
 *  • White shimmer shown ONLY while the image is loading.
 *  • Letter-avatar fallback if the image 404s.
 *  • Label clamps to 2 lines and sits directly under the tile.
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

export interface ShopCategory {
  /** Display label under the icon. */
  name: string;
  /** Square/circular image URL. */
  image: string;
  /** Internal route the icon links to. */
  href: string;
}

interface ShopByCategoryProps {
  categories: ShopCategory[];
  /** Section heading. */
  title?: string;
  /** Icons per slide on mobile. Fzokart uses 4. */
  perPage?: number;
  className?: string;
}

/* ──────────────────────────────────────────────
   ⚡ SHIMMER PRIMITIVE — copied from Fzokart
   ────────────────────────────────────────────── */
export function ShimmerBox({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`shimmer-box ${className}`} />;
}

interface CategoryItemProps {
  category: ShopCategory;
  size?: 'mobile' | 'desktop';
}

/**
 * Isolated so that changing `category.image` remounts it via `key`,
 * which resets the loading/error state without a setState-in-effect.
 * Visual output is identical to the Fzokart reference.
 */
const CategoryAvatar: React.FC<{ category: ShopCategory }> = ({ category }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // If the image is already in the browser cache the `load` event can fire
  // before React attaches the handler, leaving the shimmer stuck on screen.
  // Seed the state once, from the DOM, to cover that case.
  const [preloaded] = useState(() => {
    if (typeof window === 'undefined') return false;
    const cached = document.querySelector<HTMLImageElement>(
      `img[src="${CSS.escape(category.image)}"]`
    );
    return Boolean(cached?.complete);
  });

  const loaded = imageLoaded || preloaded;

  return (
    <>
      {/* White shimmer shown ONLY while loading */}
      {!loaded && !imageError && (
        <div className="absolute inset-0 w-full h-full bg-white z-10 pointer-events-none">
          <ShimmerBox className="w-full h-full rounded-md" />
        </div>
      )}

      {category.image && !imageError ? (
        <img
          src={category.image}
          alt={category.name}
          loading="eager"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={clsx(
            'w-full h-full object-cover transition-opacity duration-200',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      ) : (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-xs">
          {category.name.charAt(0)}
        </div>
      )}
    </>
  );
};

const CategoryIconItem: React.FC<CategoryItemProps> = ({ category, size = 'mobile' }) => {
  const isDesktop = size === 'desktop';
  const containerSize = isDesktop ? 'w-14 h-14 md:w-16 md:h-16' : 'w-12 h-12';

  return (
    <Link
      href={category.href}
      className="flex flex-col items-center justify-start text-center group cursor-pointer w-full"
    >
      <div
        className={clsx(
          'relative',
          containerSize,
          'mb-1 md:mb-1.5 rounded-md border border-gray-200/80 bg-white shadow-2xs group-hover:shadow-md transition-all flex items-center justify-center overflow-hidden shrink-0'
        )}
      >
        <CategoryAvatar key={category.image} category={category} />
      </div>
      <span
        className={clsx(
          'font-medium text-gray-700 leading-tight text-center w-full line-clamp-2',
          isDesktop ? 'text-[10px] md:text-[11px]' : 'text-[9px]'
        )}
      >
        {category.name}
      </span>
    </Link>
  );
};

/* ──────────────────────────────────────────────
   📱 MOBILE CAROUSEL — pages of N icons, snap scroll
   ────────────────────────────────────────────── */
const MobileCategoryCarousel: React.FC<{
  categories: ShopCategory[];
  perPage: number;
}> = ({ categories, perPage }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  // Group categories strictly into pages
  const pages = useMemo(() => {
    const chunked: ShopCategory[][] = [];
    for (let i = 0; i < categories.length; i += perPage) {
      chunked.push(categories.slice(i, i + perPage));
    }
    return chunked;
  }, [categories, perPage]);

  return (
    <div className="md:hidden w-full">
      {/* Clean horizontal swipe, no bottom dots, no bottom line */}
      <div
        ref={sliderRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide no-scrollbar w-full"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {pages.map((page, pageIdx) => (
          <div
            key={pageIdx}
            className="w-full flex-shrink-0 snap-center grid gap-2 px-1 py-1 items-start text-center"
            style={{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }}
          >
            {page.map((cat) => (
              <CategoryIconItem key={cat.name} category={cat} size="mobile" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ShopByCategory({
  categories,
  title = 'Shop by Categories',
  perPage = 4,
  className,
}: ShopByCategoryProps) {
  if (!categories.length) return null;

  return (
    <section className={clsx('homepage-shop-category py-3 md:py-8 px-3 md:px-8', className)}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-sm md:text-2xl font-semibold md:font-bold mb-3 md:mb-8 text-center text-gray-800 uppercase tracking-wide">
          {title}
        </h2>

        {/* Desktop View: Full width justified row of categories */}
        <div className="hidden md:flex flex-nowrap pb-2 gap-3 px-2 md:justify-between md:gap-4 no-scrollbar">
          {categories.map((category) => (
            <CategoryIconItem key={category.name} category={category} size="desktop" />
          ))}
        </div>

        {/* Mobile View: icons per page/view with smooth horizontal snap */}
        <MobileCategoryCarousel categories={categories} perPage={perPage} />
      </div>
    </section>
  );
}

export { CategoryIconItem, MobileCategoryCarousel };
