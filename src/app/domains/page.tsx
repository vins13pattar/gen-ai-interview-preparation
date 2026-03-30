import Link from 'next/link';
import { db } from '@/lib/db';

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
    <div className="bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        <div className="mb-10">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Gen AI Interview Prep
          </h1>
          <p className="max-w-prose text-lg text-zinc-600 dark:text-zinc-300">
            Browse {totalQuestions} questions across {domains.length} domains.
            Study at your own pace — no timers, no scores.
          </p>
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
                className="group rounded-xl border border-zinc-200/90 bg-white p-6 shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-zinc-600 dark:hover:shadow-lg dark:hover:shadow-black/20"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-800 dark:text-zinc-50 dark:group-hover:text-zinc-100">
                    {domain.name}
                  </h2>
                  <span className="ml-2 shrink-0 text-base font-medium tabular-nums text-zinc-600 dark:text-zinc-400">
                    {domain._count.questions} Qs
                  </span>
                </div>
                <p className="line-clamp-2 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">{domain.description}</p>

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
                    <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                      {stats.studied > 0 && <span className="font-medium text-emerald-700 dark:text-emerald-400">{stats.studied} studied</span>}
                      {stats.studied > 0 && stats.needs_review > 0 && <span> · </span>}
                      {stats.needs_review > 0 && <span className="font-medium text-amber-700 dark:text-amber-400">{stats.needs_review} needs review</span>}
                      <span className="ml-1 text-zinc-500 dark:text-zinc-500">/ {total} total</span>
                    </p>
                  </div>
                )}

                {domain.lastGeneratedAt && !hasProgress && (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    Last refreshed {new Date(domain.lastGeneratedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
