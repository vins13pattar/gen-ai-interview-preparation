import { NextRequest, NextResponse } from 'next/server';
import { saveAPIKey, hasAPIKey, validateAPIKey, deleteAPIKey } from '@/lib/apikey';

export async function GET() {
  const configured = await hasAPIKey();
  return NextResponse.json({ configured });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { apiKey, provider, model, baseUrl } = body;

  if (!provider) {
    return NextResponse.json({ error: 'provider is required' }, { status: 400 });
  }

  const resolvedKey = provider === 'ollama' ? String(apiKey ?? '') : apiKey;
  if (provider !== 'ollama' && !resolvedKey) {
    return NextResponse.json({ error: 'apiKey is required for this provider' }, { status: 400 });
  }

  const validation = await validateAPIKey(resolvedKey, { provider, model, baseUrl });
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  await saveAPIKey(resolvedKey, { provider, model, baseUrl });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await deleteAPIKey();
  return NextResponse.json({ success: true });
}
