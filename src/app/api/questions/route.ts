import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

type QuestionRow = {
  id: string;
  domainId: string;
  difficulty: string;
  question: string;
  idealAnswerCore: string;
  idealAnswerFraming: string;
  idealAnswerKeyPoints: string;
  idealAnswerFollowups: string;
  tags: string;
  source: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  bookmark_questionId: string | null;
  bookmark_state: string | null;
  bookmark_updatedAt: Date | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get('domainId');
  const difficulty = searchParams.get('difficulty');
  const bookmark = searchParams.get('bookmark'); // 'studied' | 'needs_review'
  const search = searchParams.get('q');
  const random = searchParams.get('random') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  // Use FTS5 when a search query is provided
  if (search) {
    // Sanitize input: strip FTS5 special chars, add prefix wildcard for partial matching
    const ftsQuery = search.replace(/["*]/g, '').trim() + '*';

    // Build optional WHERE clauses for additional filters
    const filters: string[] = [];
    const params: unknown[] = [ftsQuery];

    if (domainId) {
      filters.push(`q.domainId = ?`);
      params.push(domainId);
    }
    if (difficulty) {
      filters.push(`q.difficulty = ?`);
      params.push(difficulty);
    }
    if (bookmark) {
      filters.push(`bm.state = ?`);
      params.push(bookmark);
    }

    const filterClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';

    const rows = await db.$queryRawUnsafe<QuestionRow[]>(
      `SELECT
        q.id, q.domainId, q.difficulty, q.question,
        q.idealAnswerCore, q.idealAnswerFraming, q.idealAnswerKeyPoints,
        q.idealAnswerFollowups, q.tags, q.source, q.generatedAt,
        q.createdAt, q.updatedAt,
        bm.questionId as bookmark_questionId,
        bm.state as bookmark_state,
        bm.updatedAt as bookmark_updatedAt
      FROM questions_fts
      JOIN questions q ON q.rowid = questions_fts.rowid
      LEFT JOIN "Bookmark" bm ON bm.questionId = q.id
      WHERE questions_fts MATCH ?
      ${filterClause}
      ORDER BY rank
      LIMIT ${limit} OFFSET ${offset}`,
      ...params,
    );

    const countRows = await db.$queryRawUnsafe<[{ n: bigint }]>(
      `SELECT count(*) as n
      FROM questions_fts
      JOIN questions q ON q.rowid = questions_fts.rowid
      LEFT JOIN "Bookmark" bm ON bm.questionId = q.id
      WHERE questions_fts MATCH ?
      ${filterClause}`,
      ...params,
    );

    const questions = rows.map((row) => ({
      id: row.id,
      domainId: row.domainId,
      difficulty: row.difficulty,
      question: row.question,
      idealAnswerCore: row.idealAnswerCore,
      idealAnswerFraming: row.idealAnswerFraming,
      idealAnswerKeyPoints: row.idealAnswerKeyPoints,
      idealAnswerFollowups: row.idealAnswerFollowups,
      tags: row.tags,
      source: row.source,
      generatedAt: row.generatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      bookmark: row.bookmark_questionId
        ? {
            questionId: row.bookmark_questionId,
            state: row.bookmark_state,
            updatedAt: row.bookmark_updatedAt,
          }
        : null,
    }));

    return NextResponse.json({
      questions: random ? questions.sort(() => Math.random() - 0.5) : questions,
      total: Number(countRows[0].n),
    });
  }

  // Non-search path: use Prisma ORM with standard filters
  const where: Prisma.QuestionWhereInput = {};
  if (domainId) where.domainId = domainId;
  if (difficulty) where.difficulty = difficulty;
  if (bookmark) where.bookmark = { state: bookmark };

  const orderBy: Prisma.QuestionOrderByWithRelationInput = random
    ? { id: 'asc' }
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

  const results = random ? questions.sort(() => Math.random() - 0.5) : questions;

  return NextResponse.json({ questions: results, total });
}
