'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/apikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, provider, model, baseUrl: baseUrl || undefined }),
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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        <Link href="/domains" className="text-sm text-zinc-400 hover:text-zinc-700 mb-6 inline-block">← Back to Domains</Link>
        <h1 className="text-2xl font-bold text-zinc-900 mb-8">Settings</h1>

        <div className="bg-white border border-zinc-100 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Update API Key</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  const p = e.target.value as Provider;
                  setProvider(p);
                  setModel(PROVIDERS.find((x) => x.value === p)!.defaultModel);
                }}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">New API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                placeholder="Enter new key to replace existing"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            {provider === 'ollama' && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-emerald-600 text-sm">{success}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
              {loading ? 'Validating...' : 'Update Key'}
            </button>
          </form>
        </div>

        <div className="bg-white border border-red-100 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-2">Remove API Key</h2>
          <p className="text-sm text-zinc-500 mb-4">Removes the encrypted key from local storage. Question browsing will still work, but regeneration will be disabled.</p>
          <button onClick={handleDelete} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
            Remove Key
          </button>
        </div>
      </div>
    </div>
  );
}
