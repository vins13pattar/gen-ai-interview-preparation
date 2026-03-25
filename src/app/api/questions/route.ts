import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get('domainId');
  const difficulty = searchParams.get('difficulty');
  const bookmark = searchParams.get('bookmark'); // 'studied' | 'needs_review'
  const search = searchParams.get('q');
  const random = searchParams.get('random') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const where: Prisma.QuestionWhereInput = {};
  if (domainId) where.domainId = domainId;
  if (difficulty) where.difficulty = difficulty;
  if (bookmark) where.bookmark = { state: bookmark };
  if (search) {
    where.OR = [
      { question: { contains: search } },
      { idealAnswerCore: { contains: search } },
      { idealAnswerFraming: { contains: search } },
      { idealAnswerKeyPoints: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const orderBy: Prisma.QuestionOrderByWithRelationInput = random
    ? { id: 'asc' } // we'll shuffle in app
    : { createdAt: 'asc' };

  const [questions, total] = await Promise.all([
    db.question.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: { bookmark: true },
    }),
    db.question.count({ where }),
  ]);

  // Simple random shuffle when requested
  const results = random
    ? questions.sort(() => Math.random() - 0.5)
    : questions;

  return NextResponse.json({ questions: results, total });
}
