/**
 * Seed script: imports domains and questions from seed/ directory into SQLite.
 * Run with: npx tsx scripts/seed.ts
 *
 * Existing seed questions are upserted by question text so answer updates
 * (e.g. MCP 2026-07-28) replace stale copies. User-generated questions are not overwritten.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const db = new PrismaClient();

async function main() {
  const seedDir = join(process.cwd(), 'seed');

  // Seed domains
  const domains = JSON.parse(readFileSync(join(seedDir, 'domains.json'), 'utf-8'));
  console.log(`Seeding ${domains.length} domains...`);
  for (const domain of domains) {
    await db.domain.upsert({
      where: { id: domain.id },
      update: { name: domain.name, description: domain.description },
      create: { id: domain.id, slug: domain.slug, name: domain.name, description: domain.description },
    });
  }
  console.log('✓ Domains seeded');

  // Seed questions from all questions-*.json files
  const questionFiles = readdirSync(seedDir)
    .filter((f) => f.startsWith('questions-') && f.endsWith('.json'))
    .sort();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const file of questionFiles) {
    const questions = JSON.parse(readFileSync(join(seedDir, file), 'utf-8'));
    console.log(`Processing ${file} (${questions.length} questions)...`);

    for (const q of questions) {
      const text = (q.question as string).trim();
      const payload = {
        domainId: q.domainId,
        difficulty: q.difficulty,
        question: text,
        idealAnswerCore: q.idealAnswerCore,
        idealAnswerFraming: q.idealAnswerFraming,
        idealAnswerKeyPoints: JSON.stringify(q.idealAnswerKeyPoints || []),
        idealAnswerFollowups: JSON.stringify(q.idealAnswerFollowups || []),
        tags: JSON.stringify(q.tags || []),
        source: q.source || 'seed',
      };

      try {
        const existing = await db.question.findUnique({ where: { question: text } });
        if (!existing) {
          await db.question.create({ data: payload });
          created++;
          continue;
        }
        if (existing.source !== 'seed') {
          skipped++;
          continue;
        }
        await db.question.update({
          where: { id: existing.id },
          data: {
            domainId: payload.domainId,
            difficulty: payload.difficulty,
            idealAnswerCore: payload.idealAnswerCore,
            idealAnswerFraming: payload.idealAnswerFraming,
            idealAnswerKeyPoints: payload.idealAnswerKeyPoints,
            idealAnswerFollowups: payload.idealAnswerFollowups,
            tags: payload.tags,
            source: payload.source,
          },
        });
        updated++;
      } catch {
        skipped++;
      }
    }
  }

  // Update question counts per domain
  for (const domain of domains) {
    const count = await db.question.count({ where: { domainId: domain.id } });
    await db.domain.update({ where: { id: domain.id }, data: { questionCount: count } });
  }

  console.log(`\n✓ Seeded questions: ${created} created, ${updated} updated, ${skipped} skipped`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
