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
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

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

  if (!domain)
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-base text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
        Loading…
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/domains"
            className="mb-4 inline-block text-base font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← All Domains
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">{domain.name}</h1>
          <p className="mt-2 max-w-prose text-base text-zinc-600 dark:text-zinc-300">{domain.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-base text-zinc-600 dark:text-zinc-400">
            <span>{total} questions</span>
            {domain.lastGeneratedAt && (
              <span>Last refreshed {new Date(domain.lastGeneratedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search questions..."
              className="min-h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2.5 text-base font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                  }}
                  className="min-h-11 px-3 py-2.5 text-base font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'foundational', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium capitalize transition-colors ${difficulty === d ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}
              >
                {d}
              </button>
            ))}
            <div className="mx-1 hidden w-px self-stretch bg-zinc-200 sm:block dark:bg-zinc-700" />
            {(['all', 'studied', 'needs_review'] as BookmarkFilter[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBookmarkFilter(b)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium capitalize transition-colors ${bookmarkFilter === b ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}
              >
                {b.replace('_', ' ')}
              </button>
            ))}
            <div className="mx-1 hidden w-px self-stretch bg-zinc-200 sm:block dark:bg-zinc-700" />
            <button
              type="button"
              onClick={() => setRandomMode(!randomMode)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${randomMode ? 'bg-amber-600 text-white dark:bg-amber-500' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}
            >
              Random
            </button>
          </div>
        </div>

        {/* Regenerate */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="min-h-11 w-fit rounded-lg border border-zinc-300 px-4 py-2.5 text-base font-medium text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50"
          >
            {regenerating ? 'Generating...' : 'Regenerate Questions'}
          </button>
          {regenResult && <span className="text-base text-zinc-600 dark:text-zinc-400">{regenResult}</span>}
        </div>

        {/* Questions */}
        {loading ? (
          <div className="py-20 text-center text-base text-zinc-600 dark:text-zinc-400">Loading questions…</div>
        ) : questions.length === 0 ? (
          <div className="py-20 text-center text-base text-zinc-600 dark:text-zinc-400">
            No questions found. Try different filters or regenerate.
          </div>
        ) : (
          <div className="space-y-4">
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
          <div className="mt-10 border-t border-zinc-200 py-6 dark:border-zinc-800">
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Keyboard shortcuts
            </p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span>
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  →
                </kbd>{' '}
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  j
                </kbd>{' '}
                next
              </span>
              <span>
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  ←
                </kbd>{' '}
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  k
                </kbd>{' '}
                prev
              </span>
              <span>
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  s
                </kbd>{' '}
                mark studied
              </span>
              <span>
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  r
                </kbd>{' '}
                needs review
              </span>
              {randomMode && (
                <span>
                  <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                    space
                  </kbd>{' '}
                  next random
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
