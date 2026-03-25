'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Keep a stable ref to activeIndex for the keyboard handler
  const activeIndexRef = useRef<number | null>(null);
  activeIndexRef.current = activeIndex;

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

  // Reset active index when questions change
  useEffect(() => {
    setActiveIndex(questions.length > 0 ? 0 : null);
  }, [questions.length]);

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

  const handleBookmark = useCallback(async (questionId: string, state: string | null) => {
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
  }, [fetchQuestions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (questions.length === 0) return;

      const idx = activeIndexRef.current ?? 0;

      switch (e.key) {
        case 'ArrowRight':
        case 'j':
          e.preventDefault();
          setActiveIndex(Math.min(idx + 1, questions.length - 1));
          break;
        case 'ArrowLeft':
        case 'k':
          e.preventDefault();
          setActiveIndex(Math.max(idx - 1, 0));
          break;
        case 's':
          e.preventDefault();
          if (questions[idx]) handleBookmark(questions[idx].id, 'studied');
          break;
        case 'r':
          e.preventDefault();
          if (questions[idx]) handleBookmark(questions[idx].id, 'needs_review');
          break;
        case ' ':
          if (randomMode) {
            e.preventDefault();
            fetchQuestions();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [questions, randomMode, handleBookmark, fetchQuestions]);

  if (!domain) return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <Link href="/domains" className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-3 inline-block">← All Domains</Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{domain.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{domain.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
            <span>{total} questions</span>
            {domain.lastGeneratedAt && (
              <span>Last refreshed {new Date(domain.lastGeneratedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 mb-5 space-y-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search questions..."
              className="flex-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
            <button type="submit" className="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200">Search</button>
            {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm">Clear</button>}
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'foundational', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${difficulty === d ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >
                {d}
              </button>
            ))}
            <div className="w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
            {(['all', 'studied', 'needs_review'] as BookmarkFilter[]).map((b) => (
              <button
                key={b}
                onClick={() => setBookmarkFilter(b)}
                className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${bookmarkFilter === b ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >
                {b.replace('_', ' ')}
              </button>
            ))}
            <div className="w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
            <button
              onClick={() => setRandomMode(!randomMode)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${randomMode ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
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
            className="px-4 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-50 transition-colors"
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
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                onBookmark={handleBookmark}
                focused={i === activeIndex}
              />
            ))}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        {questions.length > 0 && (
          <div className="mt-8 py-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mb-2 font-medium uppercase tracking-wide">Keyboard Shortcuts</p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-500">
              <span><kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">→</kbd> <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">j</kbd> next</span>
              <span><kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">←</kbd> <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">k</kbd> prev</span>
              <span><kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">s</kbd> mark studied</span>
              <span><kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">r</kbd> needs review</span>
              {randomMode && <span><kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">space</kbd> next random</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
