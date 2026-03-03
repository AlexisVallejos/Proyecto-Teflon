import { Router } from 'express';
import { pool } from '../db.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { ensureDefaultPriceLists, ensurePricingSchema } from '../services/userPricing.js';
import { getTenantOffers } from '../services/offers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'));
    }
  }
});

export const tenantRouter = Router();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getTenantId(req, res) {
  const headerTenant = req.get('x-tenant-id');
  const tenantId = (req.user && req.user.tenantId) || headerTenant || null;
  if (!tenantId) {
    res.status(400).json({ error: 'tenant_required' });
    return null;
  }
  if (!UUID_REGEX.test(tenantId)) {
    res.status(400).json({ error: 'invalid_tenant_id' });
    return null;
  }
  return tenantId;
}

function isUuid(value) {
  return UUID_REGEX.test(String(value || ''));
}

function slugify(value) {
  if (!value) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeBrandName(value) {
  return String(value || '').trim();
}

function parseUuidArray(value) {
  const list = Array.isArray(value) ? value : [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const unique = new Set();
  for (const item of list) {
    const raw = String(item || '').trim();
    if (!raw) continue;
    if (!uuidRegex.test(raw)) {
      return { ok: false, items: [] };
    }
    unique.add(raw);
  }
  return { ok: true, items: [...unique] };
}

async function upsertTenantCommerce(tenantId, commerce) {
  const existing = await pool.query(
    'select tenant_id from tenant_settings where tenant_id = $1',
    [tenantId]
  );

  if (!existing.rowCount) {
    await pool.query(
      'insert into tenant_settings (tenant_id, branding, theme, commerce) values ($1, $2::jsonb, $3::jsonb, $4::jsonb)',
      [tenantId, {}, {}, commerce || {}]
    );
    return;
  }

  await pool.query(
    [
      'update tenant_settings',
      'set commerce = $2::jsonb,',
      'updated_at = now()',
      'where tenant_id = $1',
    ].join(' '),
    [tenantId, commerce || {}]
  );
}

tenantRouter.get('/settings', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const result = await pool.query(
      'select branding, theme, commerce from tenant_settings where tenant_id = $1',
      [tenantId]
    );
    const settings = result.rows[0] || { branding: {}, theme: {}, commerce: {} };
    return res.json({ tenant_id: tenantId, settings });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.put('/settings', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const branding = req.body.branding || {};
    const theme = req.body.theme || {};
    const commerce = req.body.commerce || {};

    const existing = await pool.query(
      'select tenant_id from tenant_settings where tenant_id = $1',
      [tenantId]
    );

    if (!existing.rowCount) {
      const insertRes = await pool.query(
        'insert into tenant_settings (tenant_id, branding, theme, commerce) values ($1, $2::jsonb, $3::jsonb, $4::jsonb) returning branding, theme, commerce',
        [tenantId, branding, theme, commerce]
      );
      return res.json({ tenant_id: tenantId, settings: insertRes.rows[0] });
    }

    const updateRes = await pool.query(
      [
        'update tenant_settings',
        'set branding = branding || $2::jsonb,',
        'theme = theme || $3::jsonb,',
        'commerce = commerce || $4::jsonb,',
        'updated_at = now()',
        'where tenant_id = $1',
        'returning branding, theme, commerce',
      ].join(' '),
      [tenantId, branding, theme, commerce]
    );

    return res.json({ tenant_id: tenantId, settings: updateRes.rows[0] });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.get('/pages/:slug', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const pageRes = await pool.query(
      'select id from pages where tenant_id = $1 and slug = $2',
      [tenantId, req.params.slug]
    );
    if (!pageRes.rowCount) {
      return res.status(404).json({ error: 'page_not_found' });
    }

    const pageId = pageRes.rows[0].id;
    const draftRes = await pool.query(
      'select id, type, enabled, sort_order, props from page_sections where page_id = $1 and state = $2 order by sort_order asc',
      [pageId, 'draft']
    );

    const source = draftRes.rowCount ? draftRes.rows : (await pool.query(
      'select id, type, enabled, sort_order, props from page_sections where page_id = $1 and state = $2 order by sort_order asc',
      [pageId, 'published']
    )).rows;

    const sections = source.map((row) => ({
      id: row.id,
      type: row.type,
      enabled: row.enabled,
      sort_order: row.sort_order,
      props: row.props || {},
    }));

    return res.json({ slug: req.params.slug, sections });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.put('/pages/:slug', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const sections = Array.isArray(req.body.sections) ? req.body.sections : null;
  if (!sections) {
    return res.status(400).json({ error: 'sections_required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let pageId;
    const pageRes = await client.query(
      'select id from pages where tenant_id = $1 and slug = $2',
      [tenantId, req.params.slug]
    );

    if (pageRes.rowCount) {
      pageId = pageRes.rows[0].id;
    } else {
      const insertRes = await client.query(
        'insert into pages (tenant_id, slug) values ($1, $2) returning id',
        [tenantId, req.params.slug]
      );
      pageId = insertRes.rows[0].id;
    }

    await client.query(
      'delete from page_sections where page_id = $1 and state = $2',
      [pageId, 'draft']
    );

    let sortOrder = 0;
    console.log(`Saving ${sections.length} sections for slug: ${req.params.slug}`);
    for (const section of sections) {
      sortOrder += 1;
      console.log(` - Section: ${section.type}, Props:`, JSON.stringify(section.props));
      await client.query(
        [
          'insert into page_sections (page_id, state, type, enabled, sort_order, props)',
          'values ($1, $2, $3, $4, $5, $6::jsonb)',
        ].join(' '),
        [
          pageId,
          'draft',
          section.type,
          section.enabled !== false,
          section.sort_order || sortOrder,
          section.props || {},
        ]
      );
    }

    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

tenantRouter.post('/pages/:slug/publish', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pageRes = await client.query(
      'select id from pages where tenant_id = $1 and slug = $2',
      [tenantId, req.params.slug]
    );
    if (!pageRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'page_not_found' });
    }

    const pageId = pageRes.rows[0].id;
    await client.query(
      'delete from page_sections where page_id = $1 and state = $2',
      [pageId, 'published']
    );

    await client.query(
      [
        'insert into page_sections (page_id, state, type, enabled, sort_order, props)',
        'select page_id, $2, type, enabled, sort_order, props',
        'from page_sections where page_id = $1 and state = $3',
      ].join(' '),
      [pageId, 'published', 'draft']
    );

    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

// Category Management
tenantRouter.get('/categories', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const result = await pool.query(
      [
        'select c.id, c.name, c.slug,',
        "nullif(c.data->>'parent_id', '') as parent_id,",
        'parent.name as parent_name',
        'from categories c',
        "left join categories parent on parent.tenant_id = c.tenant_id and parent.id::text = nullif(c.data->>'parent_id', '')",
        'where c.tenant_id = $1',
        [
          "order by coalesce(parent.name, c.name) asc,",
          "case when nullif(c.data->>'parent_id', '') is null then 0 else 1 end asc,",
          'c.name asc',
        ].join(' '),
      ].join(' '),
      [tenantId]
    );
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

tenantRouter.post('/categories', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const name = String(req.body?.name || '').trim();
  const customSlug = String(req.body?.slug || '').trim();
  const parentId = String(req.body?.parent_id || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'name_required' });
  }
  if (parentId && !isUuid(parentId)) {
    return res.status(400).json({ error: 'invalid_parent_category_id' });
  }

  let baseSlug = slugify(customSlug || name);
  if (!baseSlug) {
    baseSlug = `category-${Date.now()}`;
  }

  const client = await pool.connect();
  try {
    let parentCategory = null;
    if (parentId) {
      const parentRes = await client.query(
        'select id, name, slug from categories where tenant_id = $1 and id = $2',
        [tenantId, parentId]
      );
      if (!parentRes.rowCount) {
        return res.status(404).json({ error: 'parent_category_not_found' });
      }
      parentCategory = parentRes.rows[0];
      if (!customSlug) {
        const candidateFromParent = slugify(`${parentCategory.slug}-${name}`);
        if (candidateFromParent) {
          baseSlug = candidateFromParent;
        }
      }
    }

    const payloadData = parentCategory
      ? { parent_id: parentCategory.id }
      : {};

    let suffix = 1;
    while (true) {
      const candidate = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
      const insertRes = await client.query(
        [
          'insert into categories (tenant_id, name, slug, data)',
          'values ($1, $2, $3, $4::jsonb)',
          'on conflict (tenant_id, slug) do nothing',
          'returning id, name, slug',
        ].join(' '),
        [tenantId, name, candidate, payloadData]
      );
      if (insertRes.rowCount) {
        return res.status(201).json({
          ...insertRes.rows[0],
          parent_id: parentCategory?.id || null,
          parent_name: parentCategory?.name || null,
        });
      }
      suffix += 1;
    }
  } catch (err) {
    return next(err);
  } finally {
    client.release();
  }
});

tenantRouter.delete('/categories/:id', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const categoryId = req.params.id;
  if (!isUuid(categoryId)) {
    return res.status(400).json({ error: 'invalid_category_id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const categoryRes = await client.query(
      'select id, name from categories where tenant_id = $1 and id = $2',
      [tenantId, categoryId]
    );
    if (!categoryRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'category_not_found' });
    }

    const childrenRes = await client.query(
      [
        'select id, name',
        'from categories',
        "where tenant_id = $1 and nullif(data->>'parent_id', '') = $2",
        'order by name asc',
      ].join(' '),
      [tenantId, categoryId]
    );
    if (childrenRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'category_has_children',
        message: 'Debes eliminar primero las subcategorias de esta categoria',
        children: childrenRes.rows,
      });
    }

    // Keep advanced offers consistent when a category is removed.
    await client.query(
      [
        'update tenant_offers',
        'set category_ids = array_remove(category_ids, $2::uuid),',
        'updated_at = now()',
        'where tenant_id = $1 and $2::uuid = any(category_ids)',
      ].join(' '),
      [tenantId, categoryId]
    );

    await client.query(
      'delete from categories where tenant_id = $1 and id = $2',
      [tenantId, categoryId]
    );

    await client.query('COMMIT');
    return res.json({ ok: true, id: categoryId });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

// Brand Management
tenantRouter.get('/brands', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const [settingsRes, productRes] = await Promise.all([
      pool.query(
        'select commerce from tenant_settings where tenant_id = $1',
        [tenantId]
      ),
      pool.query(
        'select distinct brand from product_cache where tenant_id = $1 and brand is not null and trim(brand) <> \'\'',
        [tenantId]
      ),
    ]);

    const commerce = settingsRes.rows[0]?.commerce || {};
    const settingsBrands = Array.isArray(commerce.brands) ? commerce.brands : [];
    const productBrands = productRes.rows.map((row) => normalizeBrandName(row.brand)).filter(Boolean);

    const mergedMap = new Map();
    [...settingsBrands, ...productBrands].forEach((item) => {
      const clean = normalizeBrandName(item);
      if (!clean) return;
      const key = clean.toLowerCase();
      if (!mergedMap.has(key)) {
        mergedMap.set(key, clean);
      }
    });

    const brands = [...mergedMap.values()].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    return res.json(brands);
  } catch (err) {
    return next(err);
  }
});

tenantRouter.post('/brands', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const name = normalizeBrandName(req.body?.name);
  if (!name) {
    return res.status(400).json({ error: 'name_required' });
  }

  try {
    const settingsRes = await pool.query(
      'select commerce from tenant_settings where tenant_id = $1',
      [tenantId]
    );
    const commerce = settingsRes.rows[0]?.commerce || {};
    const currentBrands = Array.isArray(commerce.brands) ? commerce.brands : [];

    const existingMap = new Map();
    currentBrands.forEach((item) => {
      const clean = normalizeBrandName(item);
      if (!clean) return;
      const key = clean.toLowerCase();
      if (!existingMap.has(key)) {
        existingMap.set(key, clean);
      }
    });
    existingMap.set(name.toLowerCase(), name);

    const nextBrands = [...existingMap.values()].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    const nextCommerce = {
      ...commerce,
      brands: nextBrands,
    };

    await upsertTenantCommerce(tenantId, nextCommerce);
    return res.status(201).json({ ok: true, items: nextBrands });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.delete('/brands/:name', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const target = normalizeBrandName(decodeURIComponent(req.params.name || ''));
  if (!target) {
    return res.status(400).json({ error: 'name_required' });
  }

  try {
    const settingsRes = await pool.query(
      'select commerce from tenant_settings where tenant_id = $1',
      [tenantId]
    );
    const commerce = settingsRes.rows[0]?.commerce || {};
    const currentBrands = Array.isArray(commerce.brands) ? commerce.brands : [];

    const targetKey = target.toLowerCase();
    const nextBrands = currentBrands
      .map((item) => normalizeBrandName(item))
      .filter((item) => item && item.toLowerCase() !== targetKey);

    const nextCommerce = {
      ...commerce,
      brands: nextBrands,
    };
    await upsertTenantCommerce(tenantId, nextCommerce);

    return res.json({ ok: true, items: nextBrands });
  } catch (err) {
    return next(err);
  }
});

// Product Management
tenantRouter.get('/products', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const result = await pool.query(
      [
        [
          'select p.id, p.erp_id, p.sku, p.name, p.description, p.price, p.price_wholesale, p.stock, p.brand, p.data,',
          "(o.featured = true) as is_featured,",
          "coalesce((select array_agg(pc.category_id) from product_categories pc where pc.product_id = p.id), '{}'::uuid[]) as category_ids",
        ].join(' '),
        'from product_cache p',
        'left join product_overrides o on o.product_id = p.id and o.tenant_id = p.tenant_id',
        "where p.tenant_id = $1 and p.status = 'active' and (o.hidden is null or o.hidden = false)",
        'order by p.name asc'
      ].join(' '),
      [tenantId]
    );
    return res.json({ items: result.rows });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.get('/price-lists', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    await ensurePricingSchema();
    await ensureDefaultPriceLists(tenantId);
    const result = await pool.query(
      [
        'select id, name, type, rules_json, created_at',
        'from price_lists',
        'where tenant_id = $1',
        'order by',
        "case type when 'retail' then 1 when 'wholesale' then 2 else 3 end,",
        'created_at asc',
      ].join(' '),
      [tenantId]
    );
    return res.json({ items: result.rows });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.get('/offers', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const onlyEnabled = String(req.query.enabled || '').toLowerCase() === 'true';
    const items = await getTenantOffers(tenantId, { onlyEnabled });
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.post('/offers', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const name = String(req.body?.name || '').trim();
  const label = String(req.body?.label || 'Oferta').trim() || 'Oferta';
  const percent = Number(req.body?.percent || 0);
  const enabled = req.body?.enabled !== false;
  const usersParsed = parseUuidArray(req.body?.user_ids);
  const categoriesParsed = parseUuidArray(req.body?.category_ids);

  if (!name) {
    return res.status(400).json({ error: 'name_required' });
  }
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    return res.status(400).json({ error: 'invalid_percent' });
  }
  if (!usersParsed.ok) {
    return res.status(400).json({ error: 'invalid_user_ids' });
  }
  if (!categoriesParsed.ok) {
    return res.status(400).json({ error: 'invalid_category_ids' });
  }

  try {
    const result = await pool.query(
      [
        'insert into tenant_offers (tenant_id, name, label, percent, enabled, user_ids, category_ids)',
        'values ($1, $2, $3, $4, $5, $6::uuid[], $7::uuid[])',
        'returning id, tenant_id, name, label, percent, enabled, user_ids, category_ids, created_at, updated_at',
      ].join(' '),
      [tenantId, name, label, percent, enabled, usersParsed.items, categoriesParsed.items]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});

tenantRouter.put('/offers/:id', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const offerId = req.params.id;
  if (!isUuid(offerId)) {
    return res.status(400).json({ error: 'invalid_offer_id' });
  }

  const name = String(req.body?.name || '').trim();
  const label = String(req.body?.label || 'Oferta').trim() || 'Oferta';
  const percent = Number(req.body?.percent || 0);
  const enabled = req.body?.enabled !== false;
  const usersParsed = parseUuidArray(req.body?.user_ids);
  const categoriesParsed = parseUuidArray(req.body?.category_ids);

  if (!name) {
    return res.status(400).json({ error: 'name_required' });
  }
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    return res.status(400).json({ error: 'invalid_percent' });
  }
  if (!usersParsed.ok) {
    return res.status(400).json({ error: 'invalid_user_ids' });
  }
  if (!categoriesParsed.ok) {
    return res.status(400).json({ error: 'invalid_category_ids' });
  }

  try {
    const result = await pool.query(
      [
        'update tenant_offers',
        'set name = $3,',
        'label = $4,',
        'percent = $5,',
        'enabled = $6,',
        'user_ids = $7::uuid[],',
        'category_ids = $8::uuid[],',
        'updated_at = now()',
        'where tenant_id = $1 and id = $2',
        'returning id, tenant_id, name, label, percent, enabled, user_ids, category_ids, created_at, updated_at',
      ].join(' '),
      [
        tenantId,
        offerId,
        name,
        label,
        percent,
        enabled,
        usersParsed.items,
        categoriesParsed.items,
      ]
    );
    if (!result.rowCount) {
      return res.status(404).json({ error: 'offer_not_found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});

tenantRouter.delete('/offers/:id', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const offerId = req.params.id;
  if (!isUuid(offerId)) {
    return res.status(400).json({ error: 'invalid_offer_id' });
  }

  try {
    const result = await pool.query(
      'delete from tenant_offers where tenant_id = $1 and id = $2 returning id',
      [tenantId, offerId]
    );
    if (!result.rowCount) {
      return res.status(404).json({ error: 'offer_not_found' });
    }
    return res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.get('/users', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const offset = (page - 1) * limit;

  try {
    await ensurePricingSchema();
    const countRes = await pool.query(
      'select count(*) from user_tenants where tenant_id = $1',
      [tenantId]
    );
    const total = Number(countRes.rows[0]?.count || 0);

    const usersRes = await pool.query(
      [
        'select u.id, u.email, u.role as global_role, u.status as user_status,',
        'ut.role as role, ut.status as status, u.created_at,',
        'upl.price_list_id, pl.name as price_list_name, pl.type as price_list_type',
        'from user_tenants ut',
        'join users u on u.id = ut.user_id',
        'left join user_price_list upl on upl.tenant_id = ut.tenant_id and upl.user_id = ut.user_id',
        'left join price_lists pl on pl.id = upl.price_list_id',
        'where ut.tenant_id = $1',
        'order by u.created_at desc',
        'limit $2 offset $3',
      ].join(' '),
      [tenantId, limit, offset]
    );

    return res.json({ page, limit, total, items: usersRes.rows });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.patch('/users/:id', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const userId = req.params.id;
  if (!isUuid(userId)) {
    return res.status(400).json({ error: 'invalid_user_id' });
  }

  const role = req.body?.role != null ? String(req.body.role).trim().toLowerCase() : null;
  const status = req.body?.status != null ? String(req.body.status).trim().toLowerCase() : null;
  const validRoles = new Set(['retail', 'wholesale', 'tenant_admin']);
  const validStatuses = new Set(['active', 'pending', 'inactive']);

  if (role && !validRoles.has(role)) {
    return res.status(400).json({ error: 'invalid_role' });
  }
  if (status && !validStatuses.has(status)) {
    return res.status(400).json({ error: 'invalid_status' });
  }
  if (!role && !status) {
    return res.status(400).json({ error: 'role_or_status_required' });
  }

  const client = await pool.connect();
  try {
    await ensurePricingSchema();
    await client.query('BEGIN');
    const currentRes = await client.query(
      'select role, status from user_tenants where tenant_id = $1 and user_id = $2',
      [tenantId, userId]
    );
    if (!currentRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'user_not_found' });
    }

    const current = currentRes.rows[0];
    const nextRole = role || current.role;
    let nextStatus = status || current.status || 'active';
    if (nextRole !== 'wholesale' && nextStatus === 'pending') {
      nextStatus = 'active';
    }

    await client.query(
      'update user_tenants set role = $3, status = $4 where tenant_id = $1 and user_id = $2',
      [tenantId, userId, nextRole, nextStatus]
    );

    if (nextRole !== 'master_admin') {
      await client.query(
        "update users set role = $2 where id = $1 and role <> 'master_admin'",
        [userId, nextRole]
      );
    }

    const userRes = await client.query(
      [
        'select u.id, u.email, u.role as global_role, u.status as user_status,',
        'ut.role as role, ut.status as status, u.created_at,',
        'upl.price_list_id, pl.name as price_list_name, pl.type as price_list_type',
        'from user_tenants ut',
        'join users u on u.id = ut.user_id',
        'left join user_price_list upl on upl.tenant_id = ut.tenant_id and upl.user_id = ut.user_id',
        'left join price_lists pl on pl.id = upl.price_list_id',
        'where ut.tenant_id = $1 and ut.user_id = $2',
      ].join(' '),
      [tenantId, userId]
    );

    await client.query('COMMIT');
    return res.json({ ok: true, user: userRes.rows[0] || null });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

tenantRouter.put('/users/:id/price-list', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const userId = req.params.id;
  if (!isUuid(userId)) {
    return res.status(400).json({ error: 'invalid_user_id' });
  }

  const rawPriceListId = req.body?.price_list_id;
  const clearAssignment =
    rawPriceListId == null ||
    String(rawPriceListId).trim() === '' ||
    String(rawPriceListId).trim().toLowerCase() === 'auto';

  try {
    await ensurePricingSchema();
    const membershipRes = await pool.query(
      'select user_id from user_tenants where tenant_id = $1 and user_id = $2',
      [tenantId, userId]
    );
    if (!membershipRes.rowCount) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    if (clearAssignment) {
      await pool.query(
        'delete from user_price_list where tenant_id = $1 and user_id = $2',
        [tenantId, userId]
      );
      return res.json({ ok: true, price_list: null });
    }

    const priceListId = String(rawPriceListId).trim();
    if (!isUuid(priceListId)) {
      return res.status(400).json({ error: 'invalid_price_list_id' });
    }

    const priceListRes = await pool.query(
      'select id, name, type, rules_json from price_lists where tenant_id = $1 and id = $2',
      [tenantId, priceListId]
    );
    if (!priceListRes.rowCount) {
      return res.status(404).json({ error: 'price_list_not_found' });
    }

    await pool.query(
      [
        'insert into user_price_list (tenant_id, user_id, price_list_id, assigned_at)',
        'values ($1, $2, $3, now())',
        'on conflict (tenant_id, user_id)',
        'do update set price_list_id = excluded.price_list_id, assigned_at = now()',
      ].join(' '),
      [tenantId, userId, priceListId]
    );

    return res.json({ ok: true, price_list: priceListRes.rows[0] });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.put('/products/:id/stock', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const productId = req.params.id;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    return res.status(400).json({ error: 'invalid_product_id' });
  }

  const { stock, delta } = req.body || {};
  const hasDelta = delta !== undefined && delta !== null && delta !== '';
  const hasStock = stock !== undefined && stock !== null && stock !== '';

  if (!hasDelta && !hasStock) {
    return res.status(400).json({ error: 'stock_required' });
  }

  try {
    if (hasDelta) {
      const deltaValue = Number(delta);
      if (Number.isNaN(deltaValue)) {
        return res.status(400).json({ error: 'invalid_delta' });
      }
      const result = await pool.query(
        'update product_cache set stock = greatest(stock + $1, 0), updated_at = now() where tenant_id = $2 and id = $3 returning stock',
        [deltaValue, tenantId, productId]
      );
      if (!result.rowCount) {
        return res.status(404).json({ error: 'product_not_found' });
      }
      return res.json({ ok: true, stock: result.rows[0].stock });
    }

    const stockValue = Number(stock);
    if (Number.isNaN(stockValue)) {
      return res.status(400).json({ error: 'invalid_stock' });
    }
    const result = await pool.query(
      'update product_cache set stock = greatest($1, 0), updated_at = now() where tenant_id = $2 and id = $3 returning stock',
      [stockValue, tenantId, productId]
    );
    if (!result.rowCount) {
      return res.status(404).json({ error: 'product_not_found' });
    }
    return res.json({ ok: true, stock: result.rows[0].stock });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.delete('/products/:id', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const productId = req.params.id;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    return res.status(400).json({ error: 'invalid_product_id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'update product_cache set status = $3, updated_at = now() where tenant_id = $1 and id = $2 returning id',
      [tenantId, productId, 'archived']
    );
    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'product_not_found' });
    }

    await client.query(
      [
        'insert into product_overrides (tenant_id, product_id, hidden)',
        'values ($1, $2, true)',
        'on conflict (tenant_id, product_id) do update set hidden = true',
      ].join(' '),
      [tenantId, productId]
    );

    await client.query('COMMIT');
    return res.json({ ok: true, archived: true });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

tenantRouter.put('/products/:id', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const productId = req.params.id;
  if (!isUuid(productId)) {
    return res.status(400).json({ error: 'invalid_product_id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingRes = await client.query(
      [
        'select id, sku, name, description, price, price_wholesale, stock, brand, data',
        'from product_cache',
        "where tenant_id = $1 and id = $2 and status = 'active'",
      ].join(' '),
      [tenantId, productId]
    );
    if (!existingRes.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'product_not_found' });
    }

    const existing = existingRes.rows[0];
    const existingData = existing.data && typeof existing.data === 'object' ? existing.data : {};

    const hasCategoryPayload =
      Object.prototype.hasOwnProperty.call(req.body || {}, 'category_id') ||
      Object.prototype.hasOwnProperty.call(req.body || {}, 'category_ids');
    const hasFeaturedPayload = Object.prototype.hasOwnProperty.call(req.body || {}, 'is_featured');

    const rawName = req.body?.name ?? existing.name;
    const name = String(rawName || '').trim();
    if (!name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'name_required' });
    }

    const sku = req.body?.sku !== undefined ? String(req.body.sku || '').trim() || null : existing.sku;
    const description = req.body?.description !== undefined
      ? String(req.body.description || '').trim() || null
      : existing.description;
    const brand = req.body?.brand !== undefined
      ? normalizeBrandName(req.body.brand) || null
      : existing.brand;

    const price = req.body?.price !== undefined ? Number(req.body.price) : Number(existing.price || 0);
    const priceWholesale = req.body?.price_wholesale !== undefined
      ? Number(req.body.price_wholesale)
      : Number(existing.price_wholesale || 0);
    const stock = req.body?.stock !== undefined ? Number(req.body.stock) : Number(existing.stock || 0);

    if (!Number.isFinite(price)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'invalid_price' });
    }
    if (!Number.isFinite(priceWholesale)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'invalid_price_wholesale' });
    }
    if (!Number.isFinite(stock)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'invalid_stock' });
    }

    const rawImages = Object.prototype.hasOwnProperty.call(req.body || {}, 'images')
      ? req.body?.images
      : existingData.images;
    let imageData = [];
    if (Array.isArray(rawImages) && rawImages.length > 0) {
      imageData = rawImages
        .map((img, index) => {
          if (typeof img === 'string') {
            return { url: img, alt: name, primary: index === 0 };
          }
          if (!img || typeof img !== 'object') return null;
          const url = img.url || img.src || '';
          if (!url) return null;
          return {
            url,
            alt: img.alt || name,
            primary: img.primary === true || index === 0,
          };
        })
        .filter(Boolean);
    } else if (typeof rawImages === 'string' && rawImages.trim()) {
      imageData = [{ url: rawImages.trim(), alt: name, primary: true }];
    }

    const features = Object.prototype.hasOwnProperty.call(req.body || {}, 'features')
      ? (Array.isArray(req.body?.features) ? req.body.features : [])
      : (Array.isArray(existingData.features) ? existingData.features : []);
    const specifications = Object.prototype.hasOwnProperty.call(req.body || {}, 'specifications')
      ? (req.body?.specifications && typeof req.body.specifications === 'object' ? req.body.specifications : {})
      : (existingData.specifications && typeof existingData.specifications === 'object' ? existingData.specifications : {});
    const collection = Object.prototype.hasOwnProperty.call(req.body || {}, 'collection')
      ? (req.body?.collection || null)
      : (existingData.collection || null);
    const deliveryTime = Object.prototype.hasOwnProperty.call(req.body || {}, 'delivery_time')
      ? (req.body?.delivery_time || null)
      : (existingData.delivery_time || null);
    const warranty = Object.prototype.hasOwnProperty.call(req.body || {}, 'warranty')
      ? (req.body?.warranty || null)
      : (existingData.warranty || null);

    const productData = {
      ...existingData,
      images: imageData,
      features,
      specifications,
      collection,
      delivery_time: deliveryTime,
      warranty,
    };

    await client.query(
      [
        'update product_cache',
        'set sku = $3, name = $4, description = $5, price = $6, price_wholesale = $7, stock = greatest($8, 0), brand = $9, data = $10::jsonb, updated_at = now()',
        'where tenant_id = $1 and id = $2',
      ].join(' '),
      [tenantId, productId, sku, name, description, price, priceWholesale, stock, brand, JSON.stringify(productData)]
    );

    if (hasCategoryPayload) {
      const mergedCategoryIds = [];
      if (req.body?.category_id) mergedCategoryIds.push(req.body.category_id);
      if (Array.isArray(req.body?.category_ids)) mergedCategoryIds.push(...req.body.category_ids);

      const parsedCategories = parseUuidArray(mergedCategoryIds);
      if (!parsedCategories.ok) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'invalid_category_ids' });
      }
      const selectedCategoryIds = parsedCategories.items;

      if (selectedCategoryIds.length) {
        const validCategoriesRes = await client.query(
          'select id from categories where tenant_id = $1 and id = any($2::uuid[])',
          [tenantId, selectedCategoryIds]
        );
        if (validCategoriesRes.rowCount !== selectedCategoryIds.length) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'invalid_category_ids' });
        }
      }

      await client.query('delete from product_categories where product_id = $1', [productId]);
      if (selectedCategoryIds.length) {
        await client.query(
          [
            'insert into product_categories (product_id, category_id)',
            'select $1, unnest($2::uuid[])',
            'on conflict do nothing',
          ].join(' '),
          [productId, selectedCategoryIds]
        );
      }
    }

    if (hasFeaturedPayload) {
      await client.query(
        'insert into product_overrides (tenant_id, product_id, featured) values ($1, $2, $3) on conflict (tenant_id, product_id) do update set featured = $3',
        [tenantId, productId, !!req.body?.is_featured]
      );
    }

    await client.query('COMMIT');
    return res.json({ ok: true, id: productId });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

tenantRouter.post('/products', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const {
    sku,
    name,
    price,
    price_wholesale,
    stock,
    brand,
    description,
    images,
    is_featured,
    category_id,
    category_ids,
    features,
    specifications,
    collection,
    delivery_time,
    warranty,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name_required' });
  }

  const mergedCategoryIds = [];
  if (category_id) mergedCategoryIds.push(category_id);
  if (Array.isArray(category_ids)) {
    mergedCategoryIds.push(...category_ids);
  }
  const parsedCategories = parseUuidArray(mergedCategoryIds);
  if (!parsedCategories.ok) {
    return res.status(400).json({ error: 'invalid_category_ids' });
  }
  const selectedCategoryIds = parsedCategories.items;

  // Process images array
  let imageData = [];
  if (Array.isArray(images) && images.length > 0) {
    imageData = images.map((img, index) => ({
      url: img.url || img,
      alt: img.alt || name,
      primary: img.primary === true || index === 0 // First image is primary by default
    }));
  } else if (typeof images === 'string') {
    // Backward compatibility: single URL string
    imageData = [{ url: images, alt: name, primary: true }];
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productData = {
      images: imageData,
      features: features || [],
      specifications: specifications || {},
      collection: collection || null,
      delivery_time: delivery_time || null,
      warranty: warranty || null
    };

    const result = await client.query(
      'insert into product_cache (tenant_id, sku, name, price, price_wholesale, stock, brand, description, data) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id',
      [tenantId, sku || null, name, price || 0, price_wholesale || price || 0, stock || 0, brand || null, description || null, JSON.stringify(productData)]
    );

    const productId = result.rows[0].id;

    // Associate product with all selected categories.
    if (selectedCategoryIds.length) {
      const categoryRes = await client.query(
        'select id from categories where tenant_id = $1 and id = any($2::uuid[])',
        [tenantId, selectedCategoryIds]
      );
      if (categoryRes.rowCount !== selectedCategoryIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'invalid_category_ids' });
      }

      await client.query(
        [
          'insert into product_categories (product_id, category_id)',
          'select $1, unnest($2::uuid[])',
          'on conflict do nothing',
        ].join(' '),
        [productId, selectedCategoryIds]
      );
    }

    if (is_featured) {
      await client.query(
        'insert into product_overrides (tenant_id, product_id, featured) values ($1, $2, true) on conflict (tenant_id, product_id) do update set featured = true',
        [tenantId, productId]
      );
    }

    await client.query('COMMIT');
    return res.json({ id: productId, ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

// Image Upload Endpoint
tenantRouter.post('/products/upload-image', upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'no_file_uploaded' });
    }

    // Generate public URL for the uploaded image
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/products/${req.file.filename}`;

    return res.json({ url: imageUrl, filename: req.file.filename });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.put('/products/:id/featured', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const { featured } = req.body;
  const productId = req.params.id;

  // Validate UUID to prevent DB crash
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Note: the above regex was missing a block for the 4-char part, but let's use a better one or the same as public.js
  const betterUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!betterUuidRegex.test(productId)) {
    return res.status(400).json({ error: 'invalid_product_id' });
  }

  try {
    await pool.query(
      'insert into product_overrides (tenant_id, product_id, featured) values ($1, $2, $3) on conflict (tenant_id, product_id) do update set featured = $3',
      [tenantId, productId, !!featured]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.put('/products/featured/clear', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    await pool.query(
      'update product_overrides set featured = false where tenant_id = $1 and featured = true',
      [tenantId]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});
