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
  ''
).split(',')[0].trim();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PIQUIM_DEFAULT_BRANDING = {
  name: 'PIQUIM',
  logo_url: '',
  design_preset: 'piquim',
  navbar: {
    links: [
      { label: 'Inicio', href: '/' },
      { label: 'Catalogo', href: '/catalog' },
      { label: 'Nosotros', href: '/about' },
    ],
  },
  catalog_cards: [
    {
      id: 'heladeria',
      title: 'Heladeria',
      prefix: '01 - Frio que enamora',
      description: 'Materia prima para la elaboracion de helados artesanales, bases estables y terminaciones con sabor propio.',
      tags: ['Pulpas', 'Variegattos', 'Bases', 'Neutros'],
      image: '/piquim/catalogo/card-heladeria.png',
      category: 'heladeria',
    },
    {
      id: 'panaderia',
      title: 'Panaderia/Confiteria',
      prefix: '02 - Hornear y decorar',
      description: 'Premezclas, mejoradores, cremas y bases para panaderia, reposteria y confiteria profesional.',
      tags: ['Premezclas', 'Mejoradores', 'Cremas', 'DDL'],
      image: '/piquim/catalogo/card-panaderia.png',
      category: 'panaderia',
    },
  ],
};

const PIQUIM_DEFAULT_THEME = {
  mode: 'light',
  primary: '#ff4d00',
  accent: '#ff7a2f',
  background: '#fffaf6',
  text: '#1a1614',
  secondary: '#6f625d',
  font_family: 'Gilroy, Manrope, sans-serif',
};

const PIQUIM_DEFAULT_COMMERCE = {
  mode: 'hybrid',
  currency: 'ARS',
  address: 'Mar del Plata, Argentina',
  email: 'ventas@piquim.local',
};

async function ensurePiquimTenantBootstrap() {
  if (!PIQUIM_TENANT_ID) return;

  if (!UUID_PATTERN.test(PIQUIM_TENANT_ID)) {
    console.warn(`Skipping Piquim bootstrap: PIQUIM_TENANT_ID is not a valid UUID (${PIQUIM_TENANT_ID}).`);
    return;
  }

  await pool.query(
    [
      'INSERT INTO tenants (id, name, status)',
      "VALUES ($1::uuid, 'PIQUIM', 'active')",
      'ON CONFLICT (id) DO NOTHING',
    ].join(' '),
    [PIQUIM_TENANT_ID]
  );

  await pool.query(
    [
      'INSERT INTO tenant_settings (tenant_id, branding, theme, commerce)',
      'VALUES ($1::uuid, $2::jsonb, $3::jsonb, $4::jsonb)',
      'ON CONFLICT (tenant_id) DO NOTHING',
    ].join(' '),
    [
      PIQUIM_TENANT_ID,
      JSON.stringify(PIQUIM_DEFAULT_BRANDING),
      JSON.stringify(PIQUIM_DEFAULT_THEME),
      JSON.stringify(PIQUIM_DEFAULT_COMMERCE),
    ]
  );

  await pool.query(
    [
      'WITH seed AS (',
      'SELECT $1::uuid AS tenant_id',
      '), roots AS (',
      'INSERT INTO categories (tenant_id, name, slug, data)',
      "SELECT tenant_id, 'Heladeria', 'heladeria', '{}'::jsonb FROM seed",
      'UNION ALL',
      "SELECT tenant_id, 'Panaderia/Confiteria', 'panaderia', '{}'::jsonb FROM seed",
      'ON CONFLICT (tenant_id, slug) DO UPDATE',
      'SET name = EXCLUDED.name, data = categories.data || EXCLUDED.data',
      'RETURNING id, tenant_id, slug',
      '), panaderia AS (',
      "SELECT id, tenant_id FROM roots WHERE slug = 'panaderia'",
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

async function runStartupMigrations() {
  await pool.query(
    [
      'ALTER TABLE tenant_domains',
      'ADD COLUMN IF NOT EXISTS vercel_status text,',
      'ADD COLUMN IF NOT EXISTS vercel_payload jsonb,',
      'ADD COLUMN IF NOT EXISTS vercel_checked_at timestamptz,',
      'ADD COLUMN IF NOT EXISTS provisioning_status text,',
      'ADD COLUMN IF NOT EXISTS provisioning_payload jsonb,',
      'ADD COLUMN IF NOT EXISTS provisioning_checked_at timestamptz',
    ].join(' ')
  );

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
  await ensurePiquimTenantBootstrap();
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
