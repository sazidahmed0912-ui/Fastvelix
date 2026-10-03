'use client';

/**
 * ══════════════════════════════════════════════════════════════
 * ⚡ FASTVELIX — THREE DOT MENU
 * Design copied 1:1 from the Fzokart reference project
 * (frontend-next/app/_pages/AdminOrders.tsx).
 *
 * Behaviour copied exactly:
 *  • Portal-rendered so it escapes table/card overflow clipping.
 *  • Always opens DOWNWARD below the trigger button.
 *  • Clamped so it can never slide behind a sticky topbar.
 *  • Desktop → floating dropdown (200px, header strip + list).
 *  • Mobile (<768px) → native-style bottom action sheet
 *    with pull handle, scrollable list and Cancel button.
 *  • Closes on outside click and on window resize.
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, XCircle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface ThreeDotMenuItem {
  /** Stable unique key. */
  key: string;
  /** Visible label (rendered uppercase on desktop, normal case on mobile sheet). */
  label: string;
  /** Optional lucide icon — shown inside the mobile bottom sheet. */
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  /** Tailwind text colour class applied to the label/icon when not selected. */
  color?: string;
  /** Whether this item represents the current value. */
  selected?: boolean;
  /** Invoked on click/tap. */
  onSelect: () => void;
}

interface ThreeDotMenuProps {
  /** Unique identifier for this menu instance (usually a record id). */
  id: string;
  items: ThreeDotMenuItem[];
  /** Small caption shown in the desktop dropdown header strip. */
  menuTitle?: string;
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
  /** Secondary line shown in the mobile sheet header. */
  subtitle?: string;
  /** Main heading shown in the mobile sheet header. */
  sheetTitle?: string;
  className?: string;
  /** Disable the menu entirely. */
  disabled?: boolean;
}

const MOBILE_BREAKPOINT = 768;

export default function ThreeDotMenu({
  id,
  items,
  menuTitle = 'Update Status',
  ariaLabel = 'Open action menu',
  subtitle,
  sheetTitle = 'Update Status',
  className,
  disabled = false,
}: ThreeDotMenuProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number }>({
    top: 0,
    left: 0,
    maxHeight: 260,
  });
  const [isMobile, setIsMobile] = useState(false);

  const isOpen = openMenuId === id;

  // Close on outside click / resize — identical to the Fzokart reference.
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    const handleResize = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Track the mobile/desktop breakpoint so we render the right surface.
  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }

    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();

    // Measure the actual sticky topbar height at runtime so the
    // dropdown is never hidden behind it.
    let topbarBottom = 0;
    try {
      const topbar = document.querySelector('.lg\\:hidden.sticky') as HTMLElement | null;
      if (topbar) {
        topbarBottom = topbar.getBoundingClientRect().bottom;
      }
    } catch {
      /* selector not present — fall through with 0 */
    }

    const minTop = topbarBottom + 8; // 8px gap below the topbar
    const rawTop = rect.bottom + 4;
    const topPos = Math.max(minTop, rawTop);
    const leftPos = Math.max(8, Math.min((window.innerWidth || 360) - 170, rect.right - 160));

    setPosition({
      top: topPos,
      left: leftPos,
      maxHeight: Math.max(120, window.innerHeight - topPos - 16),
    });
    setOpenMenuId(id);
  }, [id, openMenuId]);

  const handleSelect = useCallback((item: ThreeDotMenuItem) => {
    setOpenMenuId(null);
    item.onSelect();
  }, []);

  const trigger = (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      data-testid={`three-dot-btn-${id}`}
      onClick={handleOpen}
      disabled={disabled}
      className={clsx(
        'p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
        isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      )}
    >
      <MoreVertical size={16} />
    </button>
  );

  return (
    <>
      <div className={clsx('relative', className)}>{trigger}</div>

      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={clsx(
                'fixed inset-0 z-[99998] transition-opacity',
                isMobile ? 'bg-black/50' : 'bg-transparent'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(null);
              }}
            />

            {isMobile ? (
              /* ── Mobile: native-style bottom action sheet ── */
              <div
                data-testid="three-dot-bottom-sheet"
                role="menu"
                className="fixed inset-x-0 bottom-0 z-[99999] bg-white rounded-t-3xl shadow-2xl p-5 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200 border-t border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pull handle indicator */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">{sheetTitle}</h3>
                    {subtitle && (
                      <p className="text-xs text-gray-500 font-mono font-semibold">{subtitle}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(null)}
                    aria-label="Close menu"
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 space-y-2 py-1 pr-1 overscroll-contain">
                  {items.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="menuitem"
                        onClick={() => handleSelect(item)}
                        className={clsx(
                          'w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-between border transition-all active:scale-[0.98] cursor-pointer',
                          item.selected
                            ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-md shadow-blue-500/10'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {IconComp && (
                            <IconComp
                              size={16}
                              className={item.selected ? 'text-blue-600' : item.color ?? 'text-gray-500'}
                            />
                          )}
                          <span>{item.label}</span>
                        </div>
                        {item.selected && <CheckCircle size={16} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setOpenMenuId(null)}
                  className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              /* ── Desktop: floating dropdown ── */
              <div
                data-testid="three-dot-menu"
                role="menu"
                className="fixed z-[99999] bg-white border border-gray-200 shadow-2xl rounded-xl w-[200px] flex flex-col animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                style={{
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                  maxHeight: `${position.maxHeight}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase shrink-0">
                  {menuTitle}
                </div>
                <div className="py-1 overflow-y-auto overscroll-contain">
                  {items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelect(item)}
                      className={clsx(
                        'w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer',
                        item.selected ? 'text-blue-600 bg-blue-50 font-extrabold' : 'text-gray-600'
                      )}
                    >
                      <span>{item.label}</span>
                      {item.selected && <CheckCircle size={12} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </>
  );
}
