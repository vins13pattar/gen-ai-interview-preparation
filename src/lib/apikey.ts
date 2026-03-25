/**
 * BYOK API key management.
 * Keys are encrypted at rest (AES-256-GCM) in the local SQLite DB.
 * The plaintext key is only held in memory when making LLM calls.
 */

import { db } from './db';
import { encrypt, decrypt } from './crypto';
import { createAdapter, LLMConfig, LLMProvider } from './llm';

const CONFIG_KEY_PROVIDER = 'llm_provider';
const CONFIG_KEY_API_KEY = 'llm_api_key_encrypted';
const CONFIG_KEY_BASE_URL = 'llm_base_url';
const CONFIG_KEY_MODEL = 'llm_model';

export interface APIKeyConfig {
  provider: LLMProvider;
  model?: string;
  baseUrl?: string;
}

export async function saveAPIKey(apiKey: string, config: APIKeyConfig): Promise<void> {
  const encrypted = encrypt(apiKey);
  const upsert = (key: string, value: string) =>
    db.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  await Promise.all([
    upsert(CONFIG_KEY_API_KEY, encrypted),
    upsert(CONFIG_KEY_PROVIDER, config.provider),
    upsert(CONFIG_KEY_BASE_URL, config.baseUrl ?? ''),
    upsert(CONFIG_KEY_MODEL, config.model ?? ''),
  ]);
}

export async function getAPIKeyConfig(): Promise<LLMConfig | null> {
  const rows = await db.appConfig.findMany({
    where: { key: { in: [CONFIG_KEY_API_KEY, CONFIG_KEY_PROVIDER, CONFIG_KEY_BASE_URL, CONFIG_KEY_MODEL] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (!map[CONFIG_KEY_API_KEY] || !map[CONFIG_KEY_PROVIDER]) return null;
  return {
    provider: map[CONFIG_KEY_PROVIDER] as LLMProvider,
    apiKey: decrypt(map[CONFIG_KEY_API_KEY]),
    baseUrl: map[CONFIG_KEY_BASE_URL] || undefined,
    model: map[CONFIG_KEY_MODEL] || undefined,
  };
}

export async function hasAPIKey(): Promise<boolean> {
  const row = await db.appConfig.findUnique({ where: { key: CONFIG_KEY_API_KEY } });
  return !!row;
}

export async function validateAPIKey(apiKey: string, config: APIKeyConfig): Promise<{ valid: boolean; error?: string }> {
  try {
    const adapter = createAdapter({ ...config, apiKey });
    await adapter.generate({
      systemPrompt: 'Respond with exactly: ok',
      userPrompt: 'ok',
      model: config.model ?? 'gpt-4o-mini',
      maxTokens: 5,
    });
    return { valid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('401') || message.includes('Unauthorized') || message.includes('invalid_api_key')) {
      return { valid: false, error: 'Invalid API key. Please check and try again.' };
    }
    if (message.includes('429') || message.includes('quota')) {
      return { valid: false, error: 'API quota exceeded. Please check your billing.' };
    }
    return { valid: false, error: `Validation failed: ${message}` };
  }
}

export async function deleteAPIKey(): Promise<void> {
  await db.appConfig.deleteMany({
    where: { key: { in: [CONFIG_KEY_API_KEY, CONFIG_KEY_PROVIDER, CONFIG_KEY_BASE_URL, CONFIG_KEY_MODEL] } },
  });
}
