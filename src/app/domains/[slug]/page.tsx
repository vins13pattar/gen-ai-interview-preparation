'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';

type Difficulty = 'all' | 'foundational' | 'intermediate' | 'advanced';
type BookmarkFilter = 'all' | 'studied' | 'needs_review';

interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string;
  questionCount: number;
  lastGeneratedAt: string | null;
}

interface Question {
  id: string;
  domainId: string;
  difficulty: string;
  question: string;
  idealAnswerCore: string;
  idealAnswerFraming: string;
  idealAnswerKeyPoints: string;
  idealAnswerFollowups: string;
  tags: string;
  source: string;
  bookmark?: { state: string } | null;
}

export default function DomainPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [bookmarkFilter, setBookmarkFilter] = useState<BookmarkFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regenResult, setRegenResult] = useState<string>('');
  const [randomMode, setRandomMode] = useState(false);

  // Fetch domain info
  useEffect(() => {
    fetch('/api/domains')
      .then((r) => r.json())
      .then((domains: Domain[]) => {
        const d = domains.find((x) => x.slug === slug);
        if (!d) router.push('/domains');
        else setDomain(d);
      });
  }, [slug, router]);

  const fetchQuestions = useCallback(() => {
    if (!domain) return;
    setLoading(true);
    const params = new URLSearchParams({ domainId: domain.id, limit: '100' });
    if (difficulty !== 'all') params.set('difficulty', difficulty);
    if (bookmarkFilter !== 'all') params.set('bookmark', bookmarkFilter);
    if (search) params.set('q', search);
    if (randomMode) params.set('random', 'true');

    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then(({ questions, total }) => {
        setQuestions(questions);
        setTotal(total);
        setLoading(false);
      });
  }, [domain, difficulty, bookmarkFilter, search, randomMode]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRegenerate = async () => {
    if (!domain) return;
    setRegenerating(true);
    setRegenResult('');
    const res = await fetch('/api/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainId: domain.id }),
    });
    const data = await res.json();
    setRegenerating(false);
    if (res.ok) {
      setRegenResult(`${data.added} new questions added. ${data.skipped} duplicates skipped.`);
      fetchQuestions();
    } else {
      setRegenResult(`Error: ${data.error}`);
    }
  };

  const handleBookmark = async (questionId: string, state: string | null) => {
    if (state === null) {
      await fetch(`/api/bookmarks?questionId=${questionId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, state }),
      });
    }
    fetchQuestions();
  };

  if (!domain) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <Link href="/domains" className="text-sm text-zinc-400 hover:text-zinc-700 mb-3 inline-block">← All Domains</Link>
          <h1 className="text-2xl font-bold text-zinc-900">{domain.name}</h1>
          <p className="text-zinc-500 text-sm mt-1">{domain.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
            <span>{total} questions</span>
            {domain.lastGeneratedAt && (
              <span>Last refreshed {new Date(domain.lastGeneratedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border border-zinc-100 rounded-xl p-4 mb-5 space-y-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search questions..."
              className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button type="submit" className="px-4 py-1.5 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800">Search</button>
            {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-700 text-sm">Clear</button>}
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'foundational', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${difficulty === d ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
              >
                {d}
              </button>
            ))}
            <div className="w-px bg-zinc-200 mx-1" />
            {(['all', 'studied', 'needs_review'] as BookmarkFilter[]).map((b) => (
              <button
                key={b}
                onClick={() => setBookmarkFilter(b)}
                className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${bookmarkFilter === b ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
              >
                {b.replace('_', ' ')}
              </button>
            ))}
            <div className="w-px bg-zinc-200 mx-1" />
            <button
              onClick={() => setRandomMode(!randomMode)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${randomMode ? 'bg-amber-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
            >
              Random
            </button>
          </div>
        </div>

        {/* Regenerate */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-1.5 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:border-zinc-400 disabled:opacity-50 transition-colors"
          >
            {regenerating ? 'Generating...' : 'Regenerate Questions'}
          </button>
          {regenResult && <span className="text-sm text-zinc-500">{regenResult}</span>}
        </div>

        {/* Questions */}
        {loading ? (
          <div className="text-center py-20 text-zinc-400">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">No questions found. Try different filters or regenerate.</div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onBookmark={handleBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
