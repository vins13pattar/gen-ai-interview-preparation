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
  foundational: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  intermediate: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
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
          : 'border-zinc-100 dark:border-zinc-800'
      }`}
    >
      {/* Question header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-3"
      >
        <span className="mt-0.5 shrink-0 text-zinc-600 dark:text-zinc-400">
          {expanded ? '▼' : '▶'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[question.difficulty] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
              {question.difficulty}
            </span>
            {bookmarkState && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${bookmarkState === 'studied' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {bookmarkState === 'studied' ? '✓ Studied' : '★ Needs Review'}
              </span>
            )}
            {focused && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium">
                active
              </span>
            )}
          </div>
          <p className="text-zinc-900 dark:text-zinc-100 text-sm font-medium leading-relaxed">{question.question}</p>
        </div>
      </button>

      {/* Expanded answer */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-zinc-50 dark:border-zinc-800">
          <div className="pt-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Core Concept</h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{question.idealAnswerCore}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Interview Framing</h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{question.idealAnswerFraming}</p>
            </div>

            {keyPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Key Points to Hit</h4>
                <ul className="space-y-1">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
                      <span className="text-zinc-300 dark:text-zinc-600 shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {followups.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Likely Follow-up Questions</h4>
                <ul className="space-y-1">
                  {followups.map((fq, i) => (
                    <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 italic flex gap-2">
                      <span className="text-zinc-500 dark:text-zinc-500 shrink-0">›</span>
                      <span>{fq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Bookmark controls */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleBookmark('studied')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bookmarkState === 'studied' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'}`}
              >
                ✓ Mark Studied
              </button>
              <button
                onClick={() => handleBookmark('needs_review')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bookmarkState === 'needs_review' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'}`}
              >
                ★ Needs Review
              </button>
            </div>

            {/* Related questions */}
            {related.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">Related Questions</h4>
                <ul className="space-y-1.5">
                  {related.map((rq) => (
                    <li key={rq.id} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
                      <span className="text-zinc-500 dark:text-zinc-500 shrink-0 mt-0.5">→</span>
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
