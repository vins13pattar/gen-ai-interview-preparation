import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const question = await db.question.findUnique({ where: { id } });
  if (!question) return NextResponse.json([], { status: 404 });

  let tags: string[] = [];
  try { tags = JSON.parse(question.tags); } catch { /* ignore */ }

  const candidates = await db.question.findMany({
    where: { domainId: question.domainId, id: { not: id } },
    include: { bookmark: true },
    take: 50,
  });

  // Score by tag overlap, fall back to any same-domain questions
  const scored = candidates
    .map((q) => {
      let qTags: string[] = [];
      try { qTags = JSON.parse(q.tags); } catch { /* ignore */ }
      const overlap = tags.length > 0 ? qTags.filter((t) => tags.includes(t)).length : 0;
      return { q, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map(({ q }) => q);

  return NextResponse.json(scored);
}
