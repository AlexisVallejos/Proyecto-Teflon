import dotenv from 'dotenv';
dotenv.config();
import http from 'http';

import { pool } from './db.js';
import app from './app.js';
import { ensureBaseSchema } from './services/bootstrapSchema.js';
import { ensurePricingSchema } from './services/userPricing.js';
import { ensureUserProfileSchema } from './services/userProfile.js';
import { ensureProductSyncSchema } from './services/integration.service.js';

const PIQUIM_TENANT_ID = String(
  process.env.PIQUIM_TENANT_ID ||
  process.env.PIQUIM_TENANT_IDS ||
  '636736e2-e135-44cd-ac5c-5d4ccb839a73'
).split(',')[0].trim();

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

  await pool.query(
    [
      'CREATE TABLE IF NOT EXISTS product_reviews (',
      'id uuid PRIMARY KEY DEFAULT gen_random_uuid(),',
      'tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,',
      'product_id uuid NOT NULL REFERENCES product_cache(id) ON DELETE CASCADE,',
      'user_id uuid REFERENCES users(id) ON DELETE SET NULL,',
      'rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),',
      'comment text NOT NULL,',
      "status text NOT NULL DEFAULT 'published',",
      'created_at timestamptz NOT NULL DEFAULT now(),',
      'updated_at timestamptz NOT NULL DEFAULT now()',
      ')',
    ].join(' ')
  );

  await pool.query(
    [
      'CREATE INDEX IF NOT EXISTS product_reviews_tenant_product_idx',
      'ON product_reviews(tenant_id, product_id, status, created_at DESC)',
    ].join(' ')
  );

  await pool.query(
    [
      'CREATE INDEX IF NOT EXISTS product_reviews_user_idx',
      'ON product_reviews(user_id, created_at DESC)',
    ].join(' ')
  );

  await ensureProductSyncSchema();

  if (PIQUIM_TENANT_ID) {
    await pool.query(
      [
        'WITH seed AS (',
        'SELECT $1::uuid AS tenant_id',
        '), panaderia AS (',
        'INSERT INTO categories (tenant_id, name, slug, data)',
        "SELECT tenant_id, 'Panaderia/Confiteria', 'panaderia', '{}'::jsonb FROM seed",
        'ON CONFLICT (tenant_id, slug) DO UPDATE',
        "SET name = EXCLUDED.name, data = categories.data || EXCLUDED.data",
        'RETURNING id, tenant_id',
        '), confiteria AS (',
        'SELECT c.id, c.tenant_id',
        'FROM categories c',
        'JOIN seed s ON s.tenant_id = c.tenant_id',
        "WHERE c.slug = 'confiteria'",
        '), moved_products AS (',
        'INSERT INTO product_categories (product_id, category_id)',
        'SELECT pc.product_id, p.id',
        'FROM product_categories pc',
        'JOIN confiteria c ON c.id = pc.category_id',
        'JOIN panaderia p ON p.tenant_id = c.tenant_id',
        'ON CONFLICT DO NOTHING',
        'RETURNING product_id',
        ')',
        'DELETE FROM categories c',
        'USING confiteria old_root',
        'WHERE c.id = old_root.id',
      ].join(' '),
      [PIQUIM_TENANT_ID]
    );
  }
}

// Verify DB connection on startup
const dbHost = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'NOT SET';
console.log(`Checking DB connection to: ${dbHost}`);

async function bootstrapDb() {
  try {
    await pool.query('SELECT 1');
    await ensureBaseSchema();
    await runStartupMigrations();
    console.log('DB Connection OK');
    await ensurePricingSchema();
    console.log('Pricing schema ready');
    await ensureUserProfileSchema();
    console.log('User profile schema ready');
  } catch (err) {
    console.error('DB bootstrap warning:', err?.message || err);
    throw err;
  }
}

async function startServer() {
  await bootstrapDb();

  const port = Number(process.env.PORT || 4000);
  const server = http.createServer(app);

  server.on('error', (err) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the previous API process or change PORT in server/.env.`);
      return;
    }
    console.error('Server startup error:', err);
  });

  server.on('listening', () => {
    console.log(`API listening on port ${port}`);
  });

  server.listen(port);
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err?.message || err);
});
