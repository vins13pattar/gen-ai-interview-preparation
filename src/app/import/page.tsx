'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

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
      // Reset file input
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; Back to home
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">Import Questions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a JSON file exported from this app to import questions in bulk.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              JSON file
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-gray-50 hover:file:bg-gray-100 cursor-pointer"
            />
            {file && (
              <p className="mt-1.5 text-xs text-gray-500">
                {file.name} &mdash; {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Importing…' : 'Import'}
          </button>
        </form>

        {error && (
          <div className="mt-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-2">Import complete</p>
            <ul className="space-y-1 text-sm text-green-700">
              <li>
                <span className="font-semibold">{result.imported}</span> question
                {result.imported !== 1 ? 's' : ''} imported
              </li>
              <li>
                <span className="font-semibold">{result.duplicates}</span> duplicate
                {result.duplicates !== 1 ? 's' : ''} skipped
              </li>
              {result.errors > 0 && (
                <li className="text-orange-600">
                  <span className="font-semibold">{result.errors}</span> record
                  {result.errors !== 1 ? 's' : ''} failed validation
                </li>
              )}
            </ul>
            <Link
              href="/"
              className="mt-3 inline-block text-sm text-green-700 underline hover:text-green-900"
            >
              View questions &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
