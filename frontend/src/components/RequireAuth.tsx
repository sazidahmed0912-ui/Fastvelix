'use client';

/**
 * ══════════════════════════════════════════════════════════════
 * ⚡ FASTVELIX — REQUIRE AUTH
 * Client-side gate for the /account, /seller and /admin trees.
 *
 * WHY THIS EXISTS INSTEAD OF PROXY (formerly middleware):
 * The session lives in an httpOnly cookie named `fv_token` that the
 * API sets on its own origin (fastvelix.onrender.com) with no Domain
 * attribute, so it is host-only. The browser never sends it to
 * fastvelix-shop.vercel.app, and httpOnly means client script cannot
 * read it either. A server-side gate running on the frontend origin
 * therefore observes "no token" for every visitor, including fully
 * signed-in ones, and bounced all of them to /login.
 *
 * The session simply is not observable from this origin. The only
 * truthful source is /auth/me over the API, which is what this does.
 *
 * SECURITY: this is a UX gate, not a security boundary. Every route is
 * already guarded server-side by `authenticate` + `authorize(...)` in
 * the backend (admin.ts and seller.ts mount them at the router level),
 * so a forged client state gains nothing. Hiding the shell is only so
 * signed-out visitors are not shown screens that would immediately fail.
 * ══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, RefreshCw } from 'lucide-react';
import { useStore, User } from '@/store/useStore';

/**
 * The free Render tier sleeps after ~15 minutes idle, so a cold start can
 * hold /auth/me open for 30-50s. Surface a retry instead of staring at a
 * spinner with no explanation, and never hang forever.
 */
const SLOW_AFTER_MS = 8000;

/**
 * `undefined` = still resolving, `null` = definitively not signed in,
 * a User = signed in. Keeping "unknown" distinct from "no" matters: the
 * store's own `isLoadingUser` starts out `false`, so treating that as
 * "not signed in" would redirect on the very first paint, before the
 * request had even been dispatched.
 */
type Verdict = User | null | undefined;

export default function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  /** Restrict to specific roles. Omit to allow any signed-in user. */
  roles?: User['role'][];
}) {
  const fetchUser = useStore((s) => s.fetchUser);
  const router = useRouter();
  const pathname = usePathname();

  const [verdict, setVerdict] = useState<Verdict>(undefined);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setVerdict(undefined);
    setSlow(false);

    void (async () => {
      try {
        await fetchUser();
      } finally {
        if (cancelled) return;
        // Read the store imperatively rather than closing over the `user`
        // from this render, which would still be the stale pre-fetch value.
        setVerdict(useStore.getState().user);
      }
    })();

    const timer = setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, SLOW_AFTER_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchUser, attempt]);

  // Signed out — hand them to the login page, remembering where they wanted
  // to go. `?force` lets them through even if a stale session is still around,
  // which matters here because that session lives on the other origin.
  useEffect(() => {
    if (verdict !== null) return;
    router.replace(`/login?redirect=${encodeURIComponent(pathname)}&force=1`);
  }, [verdict, pathname, router]);

  if (verdict === undefined) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 size={30} className="animate-spin text-brand" />
        <p className="text-sm text-neutral-500">
          {slow ? 'The server is taking a while to wake up.' : 'Checking your session…'}
        </p>
        {slow && (
          <>
            <p className="text-xs text-neutral-400 max-w-xs">
              This happens when the backend has been idle. It usually clears within a minute.
            </p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand hover:opacity-80 cursor-pointer"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </>
        )}
      </div>
    );
  }

  // Signed out. The effect above is performing the navigation, so render
  // nothing further: returning `null` also stops a protected screen from
  // flashing for a frame before the redirect lands.
  if (verdict === null) return null;

  // Signed in, but without the role this tree needs. Say so plainly instead
  // of silently bouncing, which reads as a broken link.
  if (roles && !roles.includes(verdict.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert size={34} className="text-red-500" />
        <div>
          <h1 className="text-lg font-bold text-dark">You don&apos;t have access to this page</h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-sm">
            You are signed in as <span className="font-semibold">{verdict.email}</span>, but this area is
            reserved for {roles.map((r) => r.replace('_', ' ').toLowerCase()).join(' or ')} accounts.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
          <Link href="/account" className="text-brand hover:opacity-80">
            My Account
          </Link>
          <Link href="/" className="text-neutral-500 hover:text-dark">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}