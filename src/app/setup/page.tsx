'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

type Provider = 'openai' | 'anthropic' | 'ollama';

const PROVIDERS: { value: Provider; label: string; placeholder: string; defaultModel: string }[] = [
  { value: 'openai', label: 'OpenAI (GPT-4o)', placeholder: 'sk-...', defaultModel: 'gpt-4o' },
  { value: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...', defaultModel: 'claude-opus-4-6' },
  { value: 'ollama', label: 'Ollama / Custom endpoint', placeholder: 'leave blank for local Ollama', defaultModel: 'llama3.2' },
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Gen AI Interview Prep
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-300">
            Add your API key to get started. Keys are encrypted and stored locally — never sent to any server other than
            your configured provider. We verify the key with a tiny test call before saving; if it fails, nothing is
            stored.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-100 p-4 text-sm leading-relaxed text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          Your API key is encrypted with AES-256 and stored in a local SQLite database. It is never logged or shared.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-base font-medium text-zinc-800 dark:text-zinc-200">Provider</label>
            <div className="grid grid-cols-1 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleProviderChange(p.value)}
                  className={`rounded-lg border px-4 py-3.5 text-left text-base transition-colors ${
                    provider === p.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                      : 'border-zinc-300 text-zinc-800 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-zinc-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-base font-medium text-zinc-800 dark:text-zinc-200">
              API Key {provider === 'ollama' ? '(optional)' : ''}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedProvider.placeholder}
              required={provider !== 'ollama'}
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

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-11 w-full rounded-lg bg-zinc-900 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {loading ? 'Validating key...' : 'Save & Start Studying'}
          </button>
        </form>
      </div>
    </div>
  );
}
