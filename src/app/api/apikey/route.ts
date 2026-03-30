import { NextRequest, NextResponse } from 'next/server';
import {
  saveAPIKey,
  validateAPIKey,
  deleteAPIKey,
  getAPIKeyConfig,
  getProviderSettingsPublic,
  isLLMProvider,
} from '@/lib/apikey';

export async function GET() {
  return NextResponse.json(await getProviderSettingsPublic());
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Expected a JSON object' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const apiKeyIn = typeof raw.apiKey === 'string' ? raw.apiKey.trim() : '';

  const hasModel = Object.prototype.hasOwnProperty.call(raw, 'model');
  const modelIn =
    hasModel && typeof raw.model === 'string' ? raw.model.trim() : undefined;
  const hasBaseUrl = Object.prototype.hasOwnProperty.call(raw, 'baseUrl');
  const baseUrlIn =
    hasBaseUrl && typeof raw.baseUrl === 'string' ? raw.baseUrl.trim() || undefined : undefined;

  if (!isLLMProvider(raw.provider)) {
    return NextResponse.json(
      { error: 'Invalid or missing provider. Use openai, anthropic, or ollama.' },
      { status: 400 },
    );
  }
  const provider = raw.provider;

  const existing = await getAPIKeyConfig();
  const apiKeyToUse = apiKeyIn || existing?.apiKey || '';

  if (provider !== 'ollama' && !apiKeyToUse) {
    return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });
  }

  if (existing && existing.provider !== provider && !apiKeyIn) {
    return NextResponse.json(
      { error: 'New API key is required when changing provider.' },
      { status: 400 },
    );
  }

  const effectiveModel = hasModel ? modelIn : existing?.model;
  const effectiveBaseUrl =
    provider === 'ollama'
      ? hasBaseUrl
        ? baseUrlIn
        : existing?.baseUrl
      : undefined;

  const validation = await validateAPIKey(apiKeyToUse, {
    provider,
    model: effectiveModel,
    baseUrl: effectiveBaseUrl,
  });
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  await saveAPIKey(apiKeyToUse, {
    provider,
    model: effectiveModel,
    baseUrl: effectiveBaseUrl,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await deleteAPIKey();
  return NextResponse.json({ success: true });
}
