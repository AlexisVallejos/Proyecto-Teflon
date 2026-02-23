import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db.js';
import app from './app.js';

async function runStartupMigrations() {
  await pool.query(
    [
      'ALTER TABLE user_tenants',
      'ADD COLUMN IF NOT EXISTS price_adjustment_percent numeric(6,2) NOT NULL DEFAULT 0',
    ].join(' ')
  );

  await pool.query(
    [
      'CREATE TABLE IF NOT EXISTS tenant_offers (',
      'id uuid PRIMARY KEY DEFAULT gen_random_uuid(),',
      'tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,',
      "name text NOT NULL,",
      "label text NOT NULL DEFAULT 'Oferta',",
      'percent numeric(6,2) NOT NULL CHECK (percent >= 0),',
      'enabled boolean NOT NULL DEFAULT true,',
      "user_ids uuid[] NOT NULL DEFAULT '{}',",
      "category_ids uuid[] NOT NULL DEFAULT '{}',",
      'created_at timestamptz NOT NULL DEFAULT now(),',
      'updated_at timestamptz NOT NULL DEFAULT now()',
      ')',
    ].join(' ')
  );

  await pool.query(
    'CREATE INDEX IF NOT EXISTS tenant_offers_tenant_idx ON tenant_offers(tenant_id, enabled)'
  );
}

// Verify DB connection on startup
const dbHost = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'NOT SET';
console.log(`Checking DB connection to: ${dbHost}`);
pool
  .query('SELECT 1')
  .then(async () => {
    await runStartupMigrations();
    console.log('DB Connection OK');
  })
  .catch((e) => console.error('DB Connection FAILED:', e.message));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
