import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DomainsPage() {
  const domains = await db.domain.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { questions: true } },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Gen AI Interview Prep</h1>
          <p className="text-zinc-500">
            Browse {domains.reduce((acc, d) => acc + d._count.questions, 0)} questions across {domains.length} domains.
            Study at your own pace — no timers, no scores.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {domains.map((domain) => (
            <Link
              key={domain.id}
              href={`/domains/${domain.slug}`}
              className="group bg-white border border-zinc-100 rounded-xl p-6 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-semibold text-zinc-900 group-hover:text-zinc-700">{domain.name}</h2>
                <span className="text-sm text-zinc-400 shrink-0 ml-2">{domain._count.questions} Qs</span>
              </div>
              <p className="text-sm text-zinc-500 line-clamp-2">{domain.description}</p>
              {domain.lastGeneratedAt && (
                <p className="text-xs text-zinc-400 mt-3">
                  Last refreshed {new Date(domain.lastGeneratedAt).toLocaleDateString()}
                </p>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/settings" className="text-zinc-500 hover:text-zinc-900 transition-colors">
            Settings
          </Link>
          <span className="text-zinc-300">·</span>
          <a href="/api/export" className="text-zinc-500 hover:text-zinc-900 transition-colors">
            Export JSON
          </a>
        </div>
      </div>
    </div>
  );
}
