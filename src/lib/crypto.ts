/**
 * AES-256-GCM encryption utilities for BYOK API key storage.
 * The encryption key is stored in a separate .keyfile (gitignored).
 * API keys are NEVER written to disk in plaintext.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits for GCM
const ALGORITHM = 'aes-256-gcm';

function getKeyfilePath(): string {
  return path.resolve(process.env.ENCRYPTION_KEY_PATH || '.keyfile');
}

function getOrCreateEncryptionKey(): Buffer {
  const keyPath = getKeyfilePath();
  if (fs.existsSync(keyPath)) {
    const keyHex = fs.readFileSync(keyPath, 'utf8').trim();
    return Buffer.from(keyHex, 'hex');
  }
  const key = crypto.randomBytes(KEY_LENGTH);
  fs.writeFileSync(keyPath, key.toString('hex'), { mode: 0o600 });
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getOrCreateEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decrypt(ciphertext: string): string {
  const key = getOrCreateEncryptionKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}
