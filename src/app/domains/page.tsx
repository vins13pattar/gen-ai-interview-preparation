import Link from 'next/link';
import { db } from '@/lib/db';
import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

type BookmarkStat = { domainId: string; state: string; count: bigint };

export default async function DomainsPage() {
  const [domains, bookmarkStats] = await Promise.all([
    db.domain.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { questions: true } },
      },
    }),
    db.$queryRaw<BookmarkStat[]>`
      SELECT q.domainId, b.state, COUNT(*) as count
      FROM "Bookmark" b
      JOIN "Question" q ON b.questionId = q.id
      GROUP BY q.domainId, b.state
    `,
  ]);

  // Build per-domain bookmark map
  const statsMap: Record<string, { studied: number; needs_review: number }> = {};
  for (const row of bookmarkStats) {
    if (!statsMap[row.domainId]) statsMap[row.domainId] = { studied: 0, needs_review: 0 };
    const n = Number(row.count);
    if (row.state === 'studied') statsMap[row.domainId].studied = n;
    else if (row.state === 'needs_review') statsMap[row.domainId].needs_review = n;
  }

  const totalQuestions = domains.reduce((acc, d) => acc + d._count.questions, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Gen AI Interview Prep
            </h1>
            <p className="max-w-prose text-base text-zinc-600 dark:text-zinc-300">
              Browse {totalQuestions} questions across {domains.length} domains.
              Study at your own pace — no timers, no scores.
            </p>
          </div>
          <div className="shrink-0 sm:pt-1">
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {domains.map((domain) => {
            const stats = statsMap[domain.id] ?? { studied: 0, needs_review: 0 };
            const total = domain._count.questions;
            const studiedPct = total > 0 ? (stats.studied / total) * 100 : 0;
            const reviewPct = total > 0 ? (stats.needs_review / total) * 100 : 0;
            const hasProgress = stats.studied > 0 || stats.needs_review > 0;

            return (
              <Link
                key={domain.id}
                href={`/domains/${domain.slug}`}
                className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-800 dark:text-zinc-50 dark:group-hover:text-zinc-100">
                    {domain.name}
                  </h2>
                  <span className="ml-2 shrink-0 text-sm font-medium tabular-nums text-zinc-600 dark:text-zinc-400">
                    {domain._count.questions} Qs
                  </span>
                </div>
                <p className="line-clamp-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">{domain.description}</p>

                {/* Study progress */}
                {hasProgress && (
                  <div className="mt-3">
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${studiedPct}%` }}
                      />
                      <div
                        className="bg-amber-400 transition-all"
                        style={{ width: `${reviewPct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {stats.studied > 0 && <span className="font-medium text-emerald-700 dark:text-emerald-400">{stats.studied} studied</span>}
                      {stats.studied > 0 && stats.needs_review > 0 && <span> · </span>}
                      {stats.needs_review > 0 && <span className="font-medium text-amber-700 dark:text-amber-400">{stats.needs_review} needs review</span>}
                      <span className="ml-1 text-zinc-500 dark:text-zinc-500">/ {total} total</span>
                    </p>
                  </div>
                )}

                {domain.lastGeneratedAt && !hasProgress && (
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                    Last refreshed {new Date(domain.lastGeneratedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-base">
          <Link
            href="/settings"
            className="font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            Settings
          </Link>
          <span className="text-zinc-400 dark:text-zinc-600" aria-hidden>
            ·
          </span>
          <a
            href="/api/export"
            className="font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            Export JSON
          </a>
        </div>
      </div>
    </div>
  );
}
