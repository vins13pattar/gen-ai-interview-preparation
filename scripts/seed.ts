/**
 * Seed script: imports domains and questions from seed/ directory into SQLite.
 * Run with: npx tsx scripts/seed.ts
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

  let total = 0;
  let skipped = 0;

  for (const file of questionFiles) {
    const questions = JSON.parse(readFileSync(join(seedDir, file), 'utf-8'));
    console.log(`Processing ${file} (${questions.length} questions)...`);

    for (const q of questions) {
      try {
        await db.question.create({
          data: {
            domainId: q.domainId,
            difficulty: q.difficulty,
            question: q.question.trim(),
            idealAnswerCore: q.idealAnswerCore,
            idealAnswerFraming: q.idealAnswerFraming,
            idealAnswerKeyPoints: JSON.stringify(q.idealAnswerKeyPoints || []),
            idealAnswerFollowups: JSON.stringify(q.idealAnswerFollowups || []),
            tags: JSON.stringify(q.tags || []),
            source: q.source || 'seed',
          },
        });
        total++;
      } catch {
        skipped++; // duplicate
      }
    }
  }

  // Update question counts per domain
  for (const domain of domains) {
    const count = await db.question.count({ where: { domainId: domain.id } });
    await db.domain.update({ where: { id: domain.id }, data: { questionCount: count } });
  }

  console.log(`\n✓ Seeded ${total} questions (${skipped} duplicates skipped)`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
