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
  intermediate: 'bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
  advanced: 'bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300',
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

  const focusRing = focused
    ? 'ring-2 ring-zinc-900 dark:ring-zinc-100'
    : '';

  return (
    <div
      ref={cardRef}
      className={`bg-white dark:bg-zinc-900 border rounded-xl transition-all ${focusRing} ${
        bookmarkState === 'studied'
          ? 'border-emerald-200 dark:border-emerald-800'
          : bookmarkState === 'needs_review'
          ? 'border-amber-200 dark:border-amber-700'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Question header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-5 text-left"
      >
        <span className="mt-0.5 shrink-0 text-zinc-600 dark:text-zinc-400" aria-hidden>
          {expanded ? '▼' : '▶'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${DIFFICULTY_COLORS[question.difficulty] ?? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'}`}>
              {question.difficulty}
            </span>
            {bookmarkState && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${bookmarkState === 'studied' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                {bookmarkState === 'studied' ? '✓ Studied' : '★ Needs Review'}
              </span>
            )}
            {focused && (
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                active
              </span>
            )}
          </div>
          <p className="text-base font-medium leading-relaxed text-zinc-900 dark:text-zinc-50">{question.question}</p>
        </div>
      </button>

      {/* Expanded answer */}
      {expanded && (
        <div className="border-t border-zinc-200 px-5 pb-5 dark:border-zinc-800">
          <div className="space-y-4 pt-4">
            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Core concept</h4>
              <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{question.idealAnswerCore}</p>
            </div>

            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Interview framing</h4>
              <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{question.idealAnswerFraming}</p>
            </div>

            {keyPoints.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Key points to hit</h4>
                <ul className="space-y-1">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                      <span className="shrink-0 text-zinc-500 dark:text-zinc-500">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {followups.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Likely follow-up questions</h4>
                <ul className="space-y-1">
                  {followups.map((fq, i) => (
                    <li key={i} className="flex gap-2 text-sm italic text-zinc-700 dark:text-zinc-300">
                      <span className="shrink-0 font-normal not-italic text-zinc-500 dark:text-zinc-500">›</span>
                      <span>{fq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{tag}</span>
                ))}
              </div>
            )}

            {/* Bookmark controls */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleBookmark('studied')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${bookmarkState === 'studied' ? 'bg-emerald-700 text-white dark:bg-emerald-600' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/40'}`}
              >
                ✓ Mark studied
              </button>
              <button
                type="button"
                onClick={() => handleBookmark('needs_review')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${bookmarkState === 'needs_review' ? 'bg-amber-600 text-white dark:bg-amber-500' : 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/40'}`}
              >
                ★ Needs review
              </button>
            </div>

            {/* Related questions */}
            {related.length > 0 && (
              <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Related questions</h4>
                <ul className="space-y-1.5">
                  {related.map((rq) => (
                    <li key={rq.id} className="flex gap-2 text-sm text-zinc-800 dark:text-zinc-200">
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
