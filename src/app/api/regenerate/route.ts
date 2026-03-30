import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAPIKeyConfig } from '@/lib/apikey';
import { createAdapter, DEFAULT_MODELS, GENERATION_SYSTEM_PROMPT } from '@/lib/llm';

interface GeneratedQuestion {
  question: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  ideal_answer: {
    core_concept: string;
    interview_framing: string;
    key_points: string[];
    follow_up_questions: string[];
  };
  tags: string[];
}

export async function POST(req: NextRequest) {
  const { domainId, count = 20 } = await req.json();

  if (!domainId) {
    return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
  }

  const domain = await db.domain.findUnique({ where: { id: domainId } });
  if (!domain) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  }

  const config = await getAPIKeyConfig();
  if (!config) {
    return NextResponse.json({ error: 'No API key configured. Please add your API key in Settings.' }, { status: 401 });
  }

  const adapter = createAdapter(config);
  const model = config.model || DEFAULT_MODELS[config.provider];

  const userPrompt = `Generate exactly ${count} interview questions for the domain: "${domain.name}".
Domain description: ${domain.description}

Focus on questions that senior Gen AI engineers and AI labs actually ask in interviews.
Include a mix of difficulties: ~30% foundational, ~50% intermediate, ~20% advanced.
Return ONLY the JSON object with a "questions" array — no markdown, no explanation.`;

  let generated: GeneratedQuestion[];
  try {
    const raw = await adapter.generate({
      systemPrompt: GENERATION_SYSTEM_PROMPT,
      userPrompt,
      model,
      maxTokens: 8000,
      responseFormat: 'json',
    });
    generated = JSON.parse(raw);
    if (!Array.isArray(generated)) throw new Error('Expected JSON array');
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  let added = 0;
  let skipped = 0;

  for (const q of generated) {
    if (!q.question || !q.ideal_answer) { skipped++; continue; }
    try {
      await db.question.create({
        data: {
          domainId,
          difficulty: q.difficulty || 'intermediate',
          question: q.question.trim(),
          idealAnswerCore: q.ideal_answer.core_concept || '',
          idealAnswerFraming: q.ideal_answer.interview_framing || '',
          idealAnswerKeyPoints: JSON.stringify(q.ideal_answer.key_points || []),
          idealAnswerFollowups: JSON.stringify(q.ideal_answer.follow_up_questions || []),
          tags: JSON.stringify(q.tags || []),
          source: 'generated',
        },
      });
      added++;
    } catch (e: unknown) {
      // Unique constraint violation = duplicate
      if (e instanceof Error && e.message.includes('Unique constraint')) {
        skipped++;
      } else {
        skipped++;
      }
    }
  }

  // Update domain lastGeneratedAt and questionCount
  await db.domain.update({
    where: { id: domainId },
    data: {
      lastGeneratedAt: new Date(),
      questionCount: await db.question.count({ where: { domainId } }),
    },
  });

  return NextResponse.json({ added, skipped, total: generated.length });
}
