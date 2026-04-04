import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  isAccessLockEnabled,
  verifySessionCookieValue,
} from '@/lib/accessSession';

export async function middleware(req: NextRequest) {
  if (!isAccessLockEnabled()) {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (pathname === '/login') {
    return NextResponse.next();
  }

  if (pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const ok = cookie ? await verifySessionCookieValue(cookie) : false;

  if (ok) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  const dest = pathname + req.nextUrl.search;
  if (dest && dest !== '/') {
    url.searchParams.set('next', dest);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
