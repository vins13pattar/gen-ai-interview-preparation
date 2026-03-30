'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Provider = 'openai' | 'anthropic' | 'ollama';

const PROVIDERS: { value: Provider; label: string; placeholder: string; defaultModel: string }[] = [
  { value: 'openai', label: 'OpenAI (GPT-4o)', placeholder: 'sk-...', defaultModel: 'gpt-4o' },
  { value: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...', defaultModel: 'claude-opus-4-6' },
  { value: 'ollama', label: 'Ollama / LM Studio (OpenAI-compatible)', placeholder: 'optional — use lm-studio if required', defaultModel: 'llama3.2' },
];

export default function SetupPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedProvider = PROVIDERS.find((p) => p.value === provider)!;

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    setModel(PROVIDERS.find((x) => x.value === p)!.defaultModel);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/apikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, provider, model, baseUrl: baseUrl || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      return;
    }

    router.push('/domains');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Gen AI Interview Prep</h1>
          <p className="text-zinc-500 text-sm">
            Add your API key to get started. Keys are encrypted and stored locally — never sent to any server other than your configured provider.
          </p>
        </div>

        <div className="mb-6 p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-xs text-zinc-500">
          Your API key is encrypted with AES-256 and stored in a local SQLite database. It is never logged or shared.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Provider</label>
            <div className="grid grid-cols-1 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleProviderChange(p.value)}
                  className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    provider === p.value
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              API Key {provider === 'ollama' ? '(optional)' : ''}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedProvider.placeholder}
              required={provider !== 'ollama'}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>

          {provider === 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Base URL</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://192.168.1.5:1234 or http://localhost:11434"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
              <p className="text-xs text-zinc-600 mt-1.5">
                LM Studio: use the OpenAI base address (port is usually 1234). <code className="text-zinc-800">/v1</code> is added automatically if missing.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Validating key...' : 'Save & Start Studying'}
          </button>
        </form>
      </div>
    </div>
  );
}
