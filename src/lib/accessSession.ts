/**
 * Optional browser session when APP_ACCESS_PASSWORD is set (self-hosted network lock).
 * Uses httpOnly cookie + HMAC; signing runs on Web Crypto (Edge middleware + Node routes).
 */

export const ACCESS_COOKIE_NAME = 'interviewprep_session';

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const PBKDF2_SALT = 'interview-prep-access-v1';

const enc = new TextEncoder();

export function isAccessLockEnabled(): boolean {
  return Boolean(process.env.APP_ACCESS_PASSWORD?.length);
}

function toBase64Url(json: string): string {
  const bytes = enc.encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function importHmacKeyFromSecret(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

async function importHmacKeyFromPassword(password: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(PBKDF2_SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  return crypto.subtle.importKey('raw', bits, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, [
    'sign',
    'verify',
  ]);
}

let signingKeyPromise: Promise<CryptoKey | null> | null = null;

async function getSigningKey(): Promise<CryptoKey | null> {
  if (!process.env.APP_ACCESS_PASSWORD?.length) return null;
  if (!signingKeyPromise) {
    signingKeyPromise = (async () => {
      if (process.env.APP_SESSION_SECRET?.length) {
        return importHmacKeyFromSecret(process.env.APP_SESSION_SECRET!);
      }
      return importHmacKeyFromPassword(process.env.APP_ACCESS_PASSWORD!);
    })();
  }
  return signingKeyPromise;
}

function hexFromSig(sig: ArrayBuffer): string {
  const bytes = new Uint8Array(sig);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i]!.toString(16).padStart(2, '0');
  return hex;
}

async function hmacHex(key: CryptoKey, message: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return hexFromSig(sig);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionCookieValue(): Promise<string> {
  const key = await getSigningKey();
  if (!key) throw new Error('Signing key unavailable');
  const exp = Date.now() + SESSION_MAX_AGE_MS;
  const payload = toBase64Url(JSON.stringify({ v: 1, exp }));
  const sig = await hmacHex(key, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionCookieValue(value: string): Promise<boolean> {
  const key = await getSigningKey();
  if (!key) return false;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return false;
  const payload = value.slice(0, dot);
  const sigHex = value.slice(dot + 1);
  const expected = await hmacHex(key, payload);
  if (!timingSafeEqualHex(sigHex, expected)) return false;
  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as { exp?: number };
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export const ACCESS_SESSION_MAX_AGE_SEC = Math.floor(SESSION_MAX_AGE_MS / 1000);
