/**
 * In-memory failed login throttling (per forwarding client IP).
 * Best-effort for self-hosted single-instance; use proxy limits for multi-replica or stricter control.
 */

import type { NextRequest } from 'next/server';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 12;
const PRUNE_THRESHOLD = 300;

type Entry = { failures: number; windowStart: number };

const store = new Map<string, Entry>();

function pruneStale(now: number): void {
  if (store.size < PRUNE_THRESHOLD) return;
  for (const [k, v] of store) {
    if (now - v.windowStart > WINDOW_MS) store.delete(k);
  }
}

export function getLoginRateLimitClientId(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

export function loginRateLimitStatus(clientId: string): { blocked: boolean; retryAfterSec?: number } {
  const now = Date.now();
  pruneStale(now);
  const e = store.get(clientId);
  if (!e) return { blocked: false };
  if (now - e.windowStart > WINDOW_MS) {
    store.delete(clientId);
    return { blocked: false };
  }
  if (e.failures >= MAX_FAILURES) {
    return {
      blocked: true,
      retryAfterSec: Math.max(1, Math.ceil((e.windowStart + WINDOW_MS - now) / 1000)),
    };
  }
  return { blocked: false };
}

export function recordLoginFailure(clientId: string): void {
  const now = Date.now();
  const e = store.get(clientId);
  if (!e || now - e.windowStart > WINDOW_MS) {
    store.set(clientId, { failures: 1, windowStart: now });
    return;
  }
  e.failures += 1;
}

export function clearLoginAttempts(clientId: string): void {
  store.delete(clientId);
}
