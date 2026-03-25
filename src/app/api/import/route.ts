import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ImportQuestion {
  domain: string;
  difficulty: string;
  question: string;
  ideal_answer: {
    core_concept: string;
    interview_framing: string;
    key_points: string[];
    follow_up_questions: string[];
  };
  tags?: string[];
  source?: string;
}

interface ImportPayload {
  questions: ImportQuestion[];
}

function isValidQuestion(q: unknown): q is ImportQuestion {
  if (!q || typeof q !== 'object') return false;
  const obj = q as Record<string, unknown>;
  if (typeof obj.domain !== 'string' || !obj.domain) return false;
  if (typeof obj.difficulty !== 'string' || !obj.difficulty) return false;
  if (typeof obj.question !== 'string' || !obj.question) return false;
  if (!obj.ideal_answer || typeof obj.ideal_answer !== 'object') return false;
  const ia = obj.ideal_answer as Record<string, unknown>;
  if (typeof ia.core_concept !== 'string') return false;
  if (typeof ia.interview_framing !== 'string') return false;
  if (!Array.isArray(ia.key_points)) return false;
  if (!Array.isArray(ia.follow_up_questions)) return false;
  return true;
}

export async function POST(req: NextRequest) {
  let payload: ImportPayload;

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const text = await (file as File).text();
    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }
  } else {
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  if (!payload || !Array.isArray(payload.questions)) {
    return NextResponse.json(
      { error: 'Invalid format: expected { questions: [...] }' },
      { status: 400 },
    );
  }

  // Fetch existing domains and question texts for dedup
  const [domains, existingQuestions] = await Promise.all([
    db.domain.findMany(),
    db.question.findMany({ select: { question: true } }),
  ]);

  const domainBySlug = new Map(domains.map((d) => [d.slug, d]));
  const existingTexts = new Set(existingQuestions.map((q) => q.question.trim().toLowerCase()));

  let imported = 0;
  let duplicates = 0;
  let errors = 0;

  for (const raw of payload.questions) {
    if (!isValidQuestion(raw)) {
      errors++;
      continue;
    }

    // Skip duplicates by exact question text match
    if (existingTexts.has(raw.question.trim().toLowerCase())) {
      duplicates++;
      continue;
    }

    // Resolve domain — create if missing
    let domain = domainBySlug.get(raw.domain);
    if (!domain) {
      domain = await db.domain.create({
        data: {
          slug: raw.domain,
          name: raw.domain
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        },
      });
      domainBySlug.set(domain.slug, domain);
    }

    try {
      await db.question.create({
        data: {
          domainId: domain.id,
          difficulty: raw.difficulty,
          question: raw.question.trim(),
          idealAnswerCore: raw.ideal_answer.core_concept,
          idealAnswerFraming: raw.ideal_answer.interview_framing,
          idealAnswerKeyPoints: JSON.stringify(raw.ideal_answer.key_points),
          idealAnswerFollowups: JSON.stringify(raw.ideal_answer.follow_up_questions),
          tags: JSON.stringify(raw.tags ?? []),
          source: raw.source ?? 'community',
        },
      });

      // Track newly imported question text to catch dupes within the same batch
      existingTexts.add(raw.question.trim().toLowerCase());
      imported++;
    } catch {
      errors++;
    }
  }

  // Update questionCount for all affected domains
  const affectedSlugs = new Set(
    payload.questions.filter(isValidQuestion).map((q) => q.domain),
  );
  await Promise.all(
    [...affectedSlugs].map(async (slug) => {
      const domain = domainBySlug.get(slug);
      if (!domain) return;
      const count = await db.question.count({ where: { domainId: domain.id } });
      await db.domain.update({ where: { id: domain.id }, data: { questionCount: count } });
    }),
  );

  return NextResponse.json({ imported, duplicates, errors });
}
