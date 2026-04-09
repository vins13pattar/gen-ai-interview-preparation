/**
 * Drops FTS5 artifacts if they exist.
 * This keeps `prisma db push` idempotent because Prisma doesn't manage
 * virtual-table shadow tables and custom triggers.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Cleaning existing FTS5 objects (if any)...');

  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS questions_ai`);
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS questions_ad`);
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS questions_au`);

  // Drop the virtual table and any leftover shadow tables.
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS questions_fts`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS questions_fts_config`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS questions_fts_data`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS questions_fts_docsize`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS questions_fts_idx`);

  console.log('FTS5 cleanup complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
