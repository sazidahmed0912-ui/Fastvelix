import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('fv_token')?.value;
  const { pathname } = request.nextUrl;

  // Protect /seller, /admin, and /account routes
  const isProtectedPath =
    pathname.startsWith('/seller') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account');

  // Auth pages (login, signup) - if logged in without ?switch or ?force, redirect to home
  const isAuthPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup');

  const isSwitchingAccount = request.nextUrl.searchParams.has('switch') || request.nextUrl.searchParams.has('force');

  if (isProtectedPath && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && token && !isSwitchingAccount) {
    // If user already logged in and simply hits /login, they might want to switch account
    // We can allow them to view login page or redirect to their role dashboard
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/seller/:path*', '/admin/:path*', '/account/:path*', '/login', '/signup'],
};
