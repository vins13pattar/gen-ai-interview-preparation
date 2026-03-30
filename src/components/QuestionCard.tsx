'use client';

import { useState, useEffect, useRef } from 'react';

interface Question {
  id: string;
  difficulty: string;
  question: string;
  idealAnswerCore: string;
  idealAnswerFraming: string;
  idealAnswerKeyPoints: string;
  idealAnswerFollowups: string;
  tags: string;
  bookmark?: { state: string } | null;
}

interface Props {
  question: Question;
  onBookmark: (questionId: string, state: string | null) => void;
  focused?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  foundational: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  intermediate: 'bg-sky-100 text-sky-950 dark:bg-sky-950/45 dark:text-sky-200',
  advanced: 'bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200',
};

export default function QuestionCard({ question, onBookmark, focused = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [related, setRelated] = useState<Question[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const keyPoints: string[] = (() => { try { return JSON.parse(question.idealAnswerKeyPoints); } catch { return []; } })();
  const followups: string[] = (() => { try { return JSON.parse(question.idealAnswerFollowups); } catch { return []; } })();
  const tags: string[] = (() => { try { return JSON.parse(question.tags); } catch { return []; } })();

  const bookmarkState = question.bookmark?.state;

  const handleBookmark = (state: string) => {
    onBookmark(question.id, bookmarkState === state ? null : state);
  };

  // Scroll into view when focused
  useEffect(() => {
    if (focused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focused]);

  // Fetch related questions when expanded
  useEffect(() => {
    if (!expanded || related.length > 0) return;
    fetch(`/api/questions/${question.id}/related`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setRelated(data))
      .catch(() => {/* ignore */});
  }, [expanded, question.id, related.length]);

  const elevation = focused
    ? 'shadow-md ring-2 ring-zinc-900 ring-offset-2 ring-offset-zinc-50 dark:ring-zinc-100 dark:ring-offset-zinc-950'
    : 'hover:shadow-md';

  return (
    <div
      ref={cardRef}
      className={`rounded-xl border bg-white shadow-sm transition-shadow duration-200 motion-reduce:transition-none dark:bg-zinc-900 dark:shadow-none ${elevation} ${
        bookmarkState === 'studied'
          ? 'border-emerald-200 dark:border-emerald-800'
          : bookmarkState === 'needs_review'
          ? 'border-amber-200 dark:border-amber-700'
          : 'border-zinc-200/90 dark:border-zinc-800'
      }`}
    >
      {/* Question header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`flex w-full items-start gap-3 p-5 text-left outline-none sm:p-6 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 ${expanded ? 'rounded-t-xl' : 'rounded-xl'}`}
      >
        <span className="mt-0.5 shrink-0 text-zinc-600 dark:text-zinc-400" aria-hidden>
          {expanded ? '▼' : '▶'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-base font-semibold capitalize ${DIFFICULTY_COLORS[question.difficulty] ?? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'}`}>
              {question.difficulty}
            </span>
            {bookmarkState && (
              <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${bookmarkState === 'studied' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                {bookmarkState === 'studied' ? '✓ Studied' : '★ Needs Review'}
              </span>
            )}
            {focused && (
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                active
              </span>
            )}
          </div>
          <p className="text-xl font-medium leading-snug text-zinc-900 dark:text-zinc-50 sm:text-2xl sm:leading-snug">
            {question.question}
          </p>
        </div>
      </button>

      {/* Expanded answer */}
      {expanded && (
        <div className="border-t border-zinc-200 px-5 pb-6 dark:border-zinc-800 sm:px-6">
          <div className="max-w-prose space-y-5 pt-5">
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Core concept
              </h4>
              <p className="text-lg leading-relaxed text-zinc-800 dark:text-zinc-200">{question.idealAnswerCore}</p>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Interview framing
              </h4>
              <p className="text-lg leading-relaxed text-zinc-800 dark:text-zinc-200">{question.idealAnswerFraming}</p>
            </div>

            {keyPoints.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Key points to hit
                </h4>
                <ul className="space-y-2">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-3 text-lg leading-relaxed text-zinc-800 dark:text-zinc-200">
                      <span className="shrink-0 text-zinc-500 dark:text-zinc-500">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {followups.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Likely follow-up questions
                </h4>
                <ul className="space-y-2">
                  {followups.map((fq, i) => (
                    <li key={i} className="flex gap-3 text-lg italic leading-relaxed text-zinc-700 dark:text-zinc-300">
                      <span className="shrink-0 font-normal not-italic text-zinc-500 dark:text-zinc-500">›</span>
                      <span>{fq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-200 px-2.5 py-1 text-base font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Bookmark controls */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleBookmark('studied')}
                className={`min-h-11 rounded-lg px-4 py-2.5 text-base font-semibold transition-colors ${bookmarkState === 'studied' ? 'bg-emerald-700 text-white dark:bg-emerald-600' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/40'}`}
              >
                ✓ Mark studied
              </button>
              <button
                type="button"
                onClick={() => handleBookmark('needs_review')}
                className={`min-h-11 rounded-lg px-4 py-2.5 text-base font-semibold transition-colors ${bookmarkState === 'needs_review' ? 'bg-amber-600 text-white dark:bg-amber-500' : 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/40'}`}
              >
                ★ Needs review
              </button>
            </div>

            {/* Related questions */}
            {related.length > 0 && (
              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Related questions
                </h4>
                <ul className="space-y-2">
                  {related.map((rq) => (
                    <li key={rq.id} className="flex gap-3 text-lg leading-relaxed text-zinc-800 dark:text-zinc-200">
                      <span className="mt-0.5 shrink-0 text-zinc-500 dark:text-zinc-500">→</span>
                      <span>{rq.question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
