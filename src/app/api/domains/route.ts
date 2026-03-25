import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const domains = await db.domain.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { questions: true } },
    },
  });
  return NextResponse.json(domains);
}
