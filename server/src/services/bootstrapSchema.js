import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { pool } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const schemaPath = path.join(projectRoot, 'db', 'schema.sql');

const REQUIRED_TABLES = [
  'tenants',
  'tenant_settings',
  'users',
  'user_tenants',
  'pages',
  'product_cache',
  'orders',
];

function buildIdempotentSchemaSql(rawSql) {
  return String(rawSql || '')
    .replace(/CREATE TABLE(?!\s+IF\s+NOT\s+EXISTS)\s+/g, 'CREATE TABLE IF NOT EXISTS ')
    .replace(/CREATE UNIQUE INDEX(?!\s+IF\s+NOT\s+EXISTS)\s+/g, 'CREATE UNIQUE INDEX IF NOT EXISTS ')
    .replace(/CREATE INDEX(?!\s+IF\s+NOT\s+EXISTS)\s+/g, 'CREATE INDEX IF NOT EXISTS ');
}

async function findMissingTables() {
  const missing = [];

  for (const tableName of REQUIRED_TABLES) {
    const result = await pool.query('select to_regclass($1) as regclass', [`public.${tableName}`]);
    if (!result.rows[0]?.regclass) {
      missing.push(tableName);
    }
  }

  return missing;
}

export async function ensureBaseSchema() {
  const missingTables = await findMissingTables();
  if (!missingTables.length) {
    return { initialized: false, missingTables: [] };
  }

  const rawSchema = await fs.readFile(schemaPath, 'utf8');
  const schemaSql = buildIdempotentSchemaSql(rawSchema);

  console.log(`Base schema missing tables detected: ${missingTables.join(', ')}`);
  await pool.query(schemaSql);
  console.log('Base schema initialized from db/schema.sql');

  return { initialized: true, missingTables };
}
