import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  ACCESS_SESSION_MAX_AGE_SEC,
  createSessionCookieValue,
  isAccessLockEnabled,
} from '@/lib/accessSession';
import {
  clearLoginAttempts,
  getLoginRateLimitClientId,
  loginRateLimitStatus,
  recordLoginFailure,
} from '@/lib/loginRateLimit';

function safeEqualPassword(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  if (!isAccessLockEnabled()) {
    return NextResponse.json({ error: 'App lock is not enabled' }, { status: 400 });
  }

  const clientId = getLoginRateLimitClientId(req);
  const limit = loginRateLimitStatus(clientId);
  if (limit.blocked) {
    const res = NextResponse.json(
      { error: 'Too many sign-in attempts. Try again later.' },
      { status: 429 },
    );
    if (limit.retryAfterSec != null) {
      res.headers.set('Retry-After', String(limit.retryAfterSec));
    }
    return res;
  }

  const expected = process.env.APP_ACCESS_PASSWORD ?? '';
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const password = typeof body === 'object' && body !== null && 'password' in body
    ? String((body as { password: unknown }).password ?? '')
    : '';

  if (!safeEqualPassword(password, expected)) {
    recordLoginFailure(clientId);
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  clearLoginAttempts(clientId);

  const value = await createSessionCookieValue();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_SESSION_MAX_AGE_SEC,
  });
  return res;
}
