'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
type ImportResult = {
  imported: number;
  duplicates: number;
  errors: number;
};

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/import', { method: 'POST', body: formData });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Import failed');
    } else {
      setResult(data as ImportResult);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12 dark:bg-zinc-950">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Import questions</h1>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            Upload a JSON file exported from this app to import questions in bulk.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-base font-medium text-zinc-800 dark:text-zinc-200">JSON file</label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="block w-full cursor-pointer text-base text-zinc-800 file:mr-4 file:rounded-lg file:border file:border-zinc-300 file:bg-zinc-50 file:px-4 file:py-2.5 file:text-base file:font-medium file:text-zinc-800 hover:file:bg-zinc-100 dark:text-zinc-200 dark:file:border-zinc-600 dark:file:bg-zinc-800 dark:file:text-zinc-100 dark:hover:file:bg-zinc-700"
            />
            {file && (
              <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
                {file.name} — {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="min-h-11 w-full rounded-lg bg-zinc-900 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {loading ? 'Importing…' : 'Import'}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <p className="mb-3 text-base font-semibold text-emerald-900 dark:text-emerald-200">Import complete</p>
            <ul className="space-y-2 text-base text-emerald-800 dark:text-emerald-300">
              <li>
                <span className="font-semibold tabular-nums">{result.imported}</span> question
                {result.imported !== 1 ? 's' : ''} imported
              </li>
              <li>
                <span className="font-semibold tabular-nums">{result.duplicates}</span> duplicate
                {result.duplicates !== 1 ? 's' : ''} skipped
              </li>
              {result.errors > 0 && (
                <li className="text-amber-800 dark:text-amber-300">
                  <span className="font-semibold tabular-nums">{result.errors}</span> record
                  {result.errors !== 1 ? 's' : ''} failed validation
                </li>
              )}
            </ul>
            <Link
              href="/domains"
              className="mt-4 inline-block text-base font-medium text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-200"
            >
              View domains →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
