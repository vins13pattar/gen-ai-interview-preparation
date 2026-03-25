'use client';

import { useState } from 'react';

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
}

const DIFFICULTY_COLORS: Record<string, string> = {
  foundational: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-blue-50 text-blue-700',
  advanced: 'bg-purple-50 text-purple-700',
};

export default function QuestionCard({ question, onBookmark }: Props) {
  const [expanded, setExpanded] = useState(false);

  const keyPoints: string[] = (() => { try { return JSON.parse(question.idealAnswerKeyPoints); } catch { return []; } })();
  const followups: string[] = (() => { try { return JSON.parse(question.idealAnswerFollowups); } catch { return []; } })();
  const tags: string[] = (() => { try { return JSON.parse(question.tags); } catch { return []; } })();

  const bookmarkState = question.bookmark?.state;

  const handleBookmark = (state: string) => {
    if (bookmarkState === state) {
      onBookmark(question.id, null); // toggle off
    } else {
      onBookmark(question.id, state);
    }
  };

  return (
    <div className={`bg-white border rounded-xl transition-all ${bookmarkState === 'studied' ? 'border-emerald-200' : bookmarkState === 'needs_review' ? 'border-amber-200' : 'border-zinc-100'}`}>
      {/* Question header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-3"
      >
        <span className="mt-0.5 shrink-0">
          {expanded ? '▼' : '▶'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[question.difficulty] ?? 'bg-zinc-100 text-zinc-600'}`}>
              {question.difficulty}
            </span>
            {bookmarkState && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${bookmarkState === 'studied' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {bookmarkState === 'studied' ? '✓ Studied' : '★ Needs Review'}
              </span>
            )}
          </div>
          <p className="text-zinc-900 text-sm font-medium leading-relaxed">{question.question}</p>
        </div>
      </button>

      {/* Expanded answer */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-zinc-50">
          <div className="pt-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Core Concept</h4>
              <p className="text-sm text-zinc-700 leading-relaxed">{question.idealAnswerCore}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Interview Framing</h4>
              <p className="text-sm text-zinc-700 leading-relaxed">{question.idealAnswerFraming}</p>
            </div>

            {keyPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Key Points to Hit</h4>
                <ul className="space-y-1">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="text-sm text-zinc-700 flex gap-2">
                      <span className="text-zinc-300 shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {followups.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Likely Follow-up Questions</h4>
                <ul className="space-y-1">
                  {followups.map((fq, i) => (
                    <li key={i} className="text-sm text-zinc-500 italic flex gap-2">
                      <span className="text-zinc-300 shrink-0">›</span>
                      <span>{fq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Bookmark controls */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleBookmark('studied')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bookmarkState === 'studied' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              >
                ✓ Mark Studied
              </button>
              <button
                onClick={() => handleBookmark('needs_review')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bookmarkState === 'needs_review' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
              >
                ★ Needs Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
