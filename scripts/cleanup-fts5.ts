/**
 * Drops FTS5 artifacts if they exist.
 * Uses `prisma db execute` so it does not depend on generated Prisma Client.
 */
import { spawnSync } from 'node:child_process';

const cleanupSql = `
DROP TRIGGER IF EXISTS questions_ai;
DROP TRIGGER IF EXISTS questions_ad;
DROP TRIGGER IF EXISTS questions_au;
DROP TABLE IF EXISTS questions_fts;
DROP TABLE IF EXISTS questions_fts_config;
DROP TABLE IF EXISTS questions_fts_data;
DROP TABLE IF EXISTS questions_fts_docsize;
DROP TABLE IF EXISTS questions_fts_idx;
`;

console.log('Cleaning existing FTS5 objects (if any)...');

const result = spawnSync(
  'pnpm',
  ['exec', 'prisma', 'db', 'execute', '--schema', 'prisma/schema.prisma', '--stdin'],
  {
    input: cleanupSql,
    stdio: ['pipe', 'inherit', 'inherit'],
    env: process.env,
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('FTS5 cleanup complete.');
