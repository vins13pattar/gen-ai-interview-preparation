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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Gen AI Interview Prep</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Browse {totalQuestions} questions across {domains.length} domains.
              Study at your own pace — no timers, no scores.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
                className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-6 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">{domain.name}</h2>
                  <span className="text-sm text-zinc-400 shrink-0 ml-2">{domain._count.questions} Qs</span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{domain.description}</p>

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
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                      {stats.studied > 0 && <span className="text-emerald-600 dark:text-emerald-500">{stats.studied} studied</span>}
                      {stats.studied > 0 && stats.needs_review > 0 && <span> · </span>}
                      {stats.needs_review > 0 && <span className="text-amber-600 dark:text-amber-500">{stats.needs_review} needs review</span>}
                      <span className="ml-1 text-zinc-400">/ {total} total</span>
                    </p>
                  </div>
                )}

                {domain.lastGeneratedAt && !hasProgress && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
                    Last refreshed {new Date(domain.lastGeneratedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/settings" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            Settings
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <a href="/api/export" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            Export JSON
          </a>
        </div>
      </div>
    </div>
  );
}
