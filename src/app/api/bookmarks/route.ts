import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { questionId, state } = await req.json();

  if (!questionId || !['studied', 'needs_review'].includes(state)) {
    return NextResponse.json({ error: 'questionId and valid state required' }, { status: 400 });
  }

  const bookmark = await db.bookmark.upsert({
    where: { questionId },
    update: { state },
    create: { questionId, state },
  });

  return NextResponse.json(bookmark);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');

  if (!questionId) {
    return NextResponse.json({ error: 'questionId required' }, { status: 400 });
  }

  await db.bookmark.deleteMany({ where: { questionId } });
  return NextResponse.json({ success: true });
}
