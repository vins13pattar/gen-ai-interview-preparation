import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const [domains, questions] = await Promise.all([
    db.domain.findMany({ orderBy: { name: 'asc' } }),
    db.question.findMany({
      orderBy: [{ domainId: 'asc' }, { difficulty: 'asc' }],
      include: { domain: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    domains,
    questions: questions.map((q) => ({
      id: q.id,
      domain: q.domain.slug,
      difficulty: q.difficulty,
      question: q.question,
      ideal_answer: {
        core_concept: q.idealAnswerCore,
        interview_framing: q.idealAnswerFraming,
        key_points: JSON.parse(q.idealAnswerKeyPoints),
        follow_up_questions: JSON.parse(q.idealAnswerFollowups),
      },
      tags: JSON.parse(q.tags),
      source: q.source,
      generated_at: q.generatedAt,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="genai-interview-questions-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}
