'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

type Provider = 'openai' | 'anthropic' | 'ollama';

const PROVIDERS = [
  { value: 'openai' as Provider, label: 'OpenAI (GPT-4o)', defaultModel: 'gpt-4o' },
  { value: 'anthropic' as Provider, label: 'Anthropic (Claude)', defaultModel: 'claude-opus-4-6' },
  { value: 'ollama' as Provider, label: 'Ollama / Custom', defaultModel: 'llama3.2' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const payload: Record<string, string> = { provider, model };
    if (apiKey.trim()) payload.apiKey = apiKey.trim();
    if (provider === 'ollama') payload.baseUrl = baseUrl.trim();

    const res = await fetch('/api/apikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Save failed');
    } else {
      setSuccess('API key updated successfully.');
      setApiKey('');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove your API key? You will need to re-add it to use regeneration features.')) return;
    await fetch('/api/apikey', { method: 'DELETE' });
    router.push('/setup');
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/apikey');
      const data = (await res.json()) as {
        configured?: boolean;
        provider?: string;
        model?: string | null;
        baseUrl?: string | null;
      };
      if (cancelled || !data.configured) return;
      setConfigured(true);
      if (data.provider === 'openai' || data.provider === 'anthropic' || data.provider === 'ollama') {
        setProvider(data.provider);
        setModel(
          data.model?.trim() ||
            PROVIDERS.find((x) => x.value === data.provider)!.defaultModel,
        );
      }
      if (data.baseUrl?.trim()) setBaseUrl(data.baseUrl.trim());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-start justify-between gap-4">
          <Link
            href="/domains"
            className="text-base font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to Domains
          </Link>
          <ThemeToggle />
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="mb-8 text-base text-zinc-600 dark:text-zinc-400">
          Update your BYOK provider, model, or rotate the API key. Keys stay encrypted locally. Before anything is
          saved, we send a minimal test request to your provider; invalid keys are rejected.
        </p>

        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Update API Key</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-2 block text-base font-medium text-zinc-800 dark:text-zinc-200">Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  const p = e.target.value as Provider;
                  setProvider(p);
                  setModel(PROVIDERS.find((x) => x.value === p)!.defaultModel);
                }}
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
              >
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-base font-medium text-zinc-800 dark:text-zinc-200">
                {configured ? 'New API Key (optional)' : 'API Key'}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required={!configured}
                placeholder={
                  configured
                    ? 'Leave blank to keep current key'
                    : 'Enter new key to replace existing'
                }
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-base font-medium text-zinc-800 dark:text-zinc-200">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
              />
            </div>
            {provider === 'ollama' && (
              <div>
                <label className="mb-1.5 block text-base font-medium text-zinc-800 dark:text-zinc-200">Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
                />
              </div>
            )}
            {error && <p className="text-base text-red-700 dark:text-red-400">{error}</p>}
            {success && <p className="text-base text-emerald-700 dark:text-emerald-400">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="min-h-11 w-full rounded-lg bg-zinc-900 py-2.5 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {loading ? 'Validating...' : 'Update Key'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-zinc-900 sm:p-8">
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Remove API Key</h2>
          <p className="mb-4 text-base text-zinc-600 dark:text-zinc-400">
            Removes the encrypted key from local storage. Question browsing will still work, but regeneration will be disabled.
          </p>
          <button
            onClick={handleDelete}
            className="min-h-10 rounded-lg border border-red-300 px-4 py-2.5 text-base font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            Remove Key
          </button>
        </div>
      </div>
    </div>
  );
}
