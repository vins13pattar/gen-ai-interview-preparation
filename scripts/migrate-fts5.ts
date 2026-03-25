/**
 * Applies FTS5 full-text search migration to the SQLite database.
 * Safe to run multiple times (uses CREATE VIRTUAL TABLE IF NOT EXISTS).
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Applying FTS5 migration...');

  // Drop and recreate to ensure correct content table reference (Prisma uses "Question", not "questions")
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS questions_fts`);

  // Create FTS5 virtual table backed by the Question content table
  await db.$executeRawUnsafe(`
    CREATE VIRTUAL TABLE questions_fts USING fts5(
      question,
      idealAnswerCore,
      idealAnswerFraming,
      idealAnswerKeyPoints,
      tags,
      content='Question',
      content_rowid=rowid
    )
  `);

  // INSERT trigger
  await db.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS questions_ai AFTER INSERT ON "Question" BEGIN
      INSERT INTO questions_fts(rowid, question, idealAnswerCore, idealAnswerFraming, idealAnswerKeyPoints, tags)
      VALUES (new.rowid, new.question, new.idealAnswerCore, new.idealAnswerFraming, new.idealAnswerKeyPoints, new.tags);
    END
  `);

  // DELETE trigger
  await db.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS questions_ad AFTER DELETE ON "Question" BEGIN
      INSERT INTO questions_fts(questions_fts, rowid, question, idealAnswerCore, idealAnswerFraming, idealAnswerKeyPoints, tags)
      VALUES ('delete', old.rowid, old.question, old.idealAnswerCore, old.idealAnswerFraming, old.idealAnswerKeyPoints, old.tags);
    END
  `);

  // UPDATE trigger
  await db.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS questions_au AFTER UPDATE ON "Question" BEGIN
      INSERT INTO questions_fts(questions_fts, rowid, question, idealAnswerCore, idealAnswerFraming, idealAnswerKeyPoints, tags)
      VALUES ('delete', old.rowid, old.question, old.idealAnswerCore, old.idealAnswerFraming, old.idealAnswerKeyPoints, old.tags);
      INSERT INTO questions_fts(rowid, question, idealAnswerCore, idealAnswerFraming, idealAnswerKeyPoints, tags)
      VALUES (new.rowid, new.question, new.idealAnswerCore, new.idealAnswerFraming, new.idealAnswerKeyPoints, new.tags);
    END
  `);

  // Rebuild the FTS index from existing data
  console.log('Rebuilding FTS5 index from existing data...');
  await db.$executeRawUnsafe(`INSERT INTO questions_fts(questions_fts) VALUES('rebuild')`);

  const result = await db.$queryRaw<[{ n: bigint }]>`SELECT count(*) as n FROM questions_fts`;
  console.log(`FTS5 migration complete. Indexed ${result[0].n} questions.`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
