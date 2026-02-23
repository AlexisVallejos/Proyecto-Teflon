import { Router } from 'express';
import { pool } from '../db.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

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

function getTenantId(req, res) {
  const headerTenant = req.get('x-tenant-id');
  const tenantId = (req.user && req.user.tenantId) || headerTenant || null;
  if (!tenantId) {
    res.status(400).json({ error: 'tenant_required' });
    return null;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    res.status(400).json({ error: 'invalid_tenant_id' });
    return null;
  }
  return tenantId;
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
      'select id, name, slug from categories where tenant_id = $1 order by name asc',
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
  if (!name) {
    return res.status(400).json({ error: 'name_required' });
  }

  let baseSlug = slugify(customSlug || name);
  if (!baseSlug) {
    baseSlug = `category-${Date.now()}`;
  }

  const client = await pool.connect();
  try {
    let suffix = 1;
    while (true) {
      const candidate = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
      const insertRes = await client.query(
        'insert into categories (tenant_id, name, slug) values ($1, $2, $3) on conflict (tenant_id, slug) do nothing returning id, name, slug',
        [tenantId, name, candidate]
      );
      if (insertRes.rowCount) {
        return res.status(201).json(insertRes.rows[0]);
      }
      suffix += 1;
    }
  } catch (err) {
    return next(err);
  } finally {
    client.release();
  }
});

// Product Management
tenantRouter.get('/products', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const result = await pool.query(
      [
        'select p.id, p.erp_id, p.sku, p.name, p.price, p.price_wholesale, p.stock, p.brand, p.data, (o.featured = true) as is_featured',
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

tenantRouter.get('/users', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const offset = (page - 1) * limit;

  try {
    const countRes = await pool.query(
      'select count(*) from user_tenants where tenant_id = $1',
      [tenantId]
    );
    const total = Number(countRes.rows[0]?.count || 0);

    const usersRes = await pool.query(
      [
        'select u.id, u.email, u.role as global_role, u.status as user_status,',
        'ut.role as role, ut.status as status, ut.price_adjustment_percent, u.created_at',
        'from user_tenants ut',
        'join users u on u.id = ut.user_id',
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

tenantRouter.get('/offers', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const result = await pool.query(
      [
        'select id, tenant_id, name, label, percent, enabled, user_ids, category_ids, created_at, updated_at',
        'from tenant_offers',
        'where tenant_id = $1',
        'order by created_at desc',
      ].join(' '),
      [tenantId]
    );
    return res.json({ items: result.rows });
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
  const parsedUsers = parseUuidArray(req.body?.user_ids);
  const parsedCategories = parseUuidArray(req.body?.category_ids);

  if (!name) return res.status(400).json({ error: 'name_required' });
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return res.status(400).json({ error: 'invalid_percent' });
  }
  if (!parsedUsers.ok) return res.status(400).json({ error: 'invalid_user_ids' });
  if (!parsedCategories.ok) return res.status(400).json({ error: 'invalid_category_ids' });

  try {
    const result = await pool.query(
      [
        'insert into tenant_offers (tenant_id, name, label, percent, enabled, user_ids, category_ids)',
        'values ($1, $2, $3, $4, $5, $6::uuid[], $7::uuid[])',
        'returning id, tenant_id, name, label, percent, enabled, user_ids, category_ids, created_at, updated_at',
      ].join(' '),
      [tenantId, name, label, percent, enabled, parsedUsers.items, parsedCategories.items]
    );
    return res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.put('/offers/:id', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const offerId = String(req.params.id || '').trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(offerId)) return res.status(400).json({ error: 'invalid_offer_id' });

  const name = String(req.body?.name || '').trim();
  const label = String(req.body?.label || 'Oferta').trim() || 'Oferta';
  const percent = Number(req.body?.percent || 0);
  const enabled = req.body?.enabled !== false;
  const parsedUsers = parseUuidArray(req.body?.user_ids);
  const parsedCategories = parseUuidArray(req.body?.category_ids);

  if (!name) return res.status(400).json({ error: 'name_required' });
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return res.status(400).json({ error: 'invalid_percent' });
  }
  if (!parsedUsers.ok) return res.status(400).json({ error: 'invalid_user_ids' });
  if (!parsedCategories.ok) return res.status(400).json({ error: 'invalid_category_ids' });

  try {
    const result = await pool.query(
      [
        'update tenant_offers',
        'set name = $3, label = $4, percent = $5, enabled = $6, user_ids = $7::uuid[], category_ids = $8::uuid[], updated_at = now()',
        'where tenant_id = $1 and id = $2',
        'returning id, tenant_id, name, label, percent, enabled, user_ids, category_ids, created_at, updated_at',
      ].join(' '),
      [tenantId, offerId, name, label, percent, enabled, parsedUsers.items, parsedCategories.items]
    );

    if (!result.rowCount) return res.status(404).json({ error: 'offer_not_found' });
    return res.json({ item: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.delete('/offers/:id', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const offerId = String(req.params.id || '').trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(offerId)) return res.status(400).json({ error: 'invalid_offer_id' });

  try {
    const result = await pool.query(
      'delete from tenant_offers where tenant_id = $1 and id = $2 returning id',
      [tenantId, offerId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'offer_not_found' });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.patch('/users/:id/price-adjustment', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const userId = req.params.id;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return res.status(400).json({ error: 'invalid_user_id' });
  }

  const rawPercent = Number(req.body?.price_adjustment_percent);
  if (!Number.isFinite(rawPercent)) {
    return res.status(400).json({ error: 'invalid_price_adjustment_percent' });
  }

  const clampedPercent = Math.max(-90, Math.min(500, rawPercent));

  try {
    const result = await pool.query(
      [
        'update user_tenants',
        'set price_adjustment_percent = $3',
        'where tenant_id = $1 and user_id = $2',
        'returning user_id, tenant_id, price_adjustment_percent',
      ].join(' '),
      [tenantId, userId, clampedPercent]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'user_not_found_for_tenant' });
    }

    return res.json({ ok: true, item: result.rows[0] });
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

tenantRouter.post('/products', async (req, res, next) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  const { sku, name, price, price_wholesale, stock, brand, description, images, is_featured, category_id, features, specifications, collection, delivery_time, warranty } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name_required' });
  }

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

    // Associate with category if provided
    if (category_id) {
      await client.query(
        'insert into product_categories (product_id, category_id) values ($1, $2) on conflict do nothing',
        [productId, category_id]
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
