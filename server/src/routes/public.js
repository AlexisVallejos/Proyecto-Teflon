import express from 'express';
import { resolveTenant } from '../middleware/tenant.js';
import { pool } from '../db.js';

export const publicRouter = express.Router();

publicRouter.use(resolveTenant);

publicRouter.get('/tenant', async (req, res, next) => {
  try {
    const result = await pool.query(
      'select branding, theme, commerce from tenant_settings where tenant_id = $1',
      [req.tenant.id]
    );
    const settings = result.rows[0] || { branding: {}, theme: {}, commerce: {} };
    return res.json({ tenant: req.tenant, settings });
  } catch (err) {
    return next(err);
  }
});

publicRouter.get('/pages/:slug', async (req, res, next) => {
  try {
    const pageRes = await pool.query(
      'select id from pages where tenant_id = $1 and slug = $2',
      [req.tenant.id, req.params.slug]
    );
    if (!pageRes.rowCount) {
      return res.status(404).json({ error: 'page_not_found' });
    }

    const sectionsRes = await pool.query(
      'select id, type, enabled, sort_order, props from page_sections where page_id = $1 and state = $2 order by sort_order asc',
      [pageRes.rows[0].id, 'published']
    );

    const sections = sectionsRes.rows
      .filter((row) => row.enabled)
      .map((row) => ({
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

publicRouter.get('/products', async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const q = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '24', 10), 100);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const offset = (page - 1) * limit;

    const params = [tenantId];
    let where = 'p.tenant_id = $1 and (o.hidden is null or o.hidden = false)';

    if (q) {
      params.push(`%${q}%`);
      where += ` and (p.name ilike $2 or p.description ilike $2)`;
    }

    params.push(limit);
    const limitIndex = params.length;
    params.push(offset);
    const offsetIndex = params.length;

    const sql = [
      'select p.id, p.erp_id, p.sku, p.name, p.description, p.price, p.currency, p.stock, p.data',
      'from product_cache p',
      'left join product_overrides o on o.product_id = p.id and o.tenant_id = p.tenant_id',
      `where ${where}`,
      `order by p.name asc limit $${limitIndex} offset $${offsetIndex}`,
    ].join(' ');

    const productsRes = await pool.query(sql, params);
    const products = productsRes.rows.map((row) => ({
      id: row.id,
      erp_id: row.erp_id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      price: row.price,
      currency: row.currency,
      stock: row.stock,
      data: row.data || {},
    }));

    return res.json({ page, limit, items: products });
  } catch (err) {
    return next(err);
  }
});

publicRouter.get('/products/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'select id, erp_id, sku, name, description, price, currency, stock, data from product_cache where tenant_id = $1 and id = $2',
      [req.tenant.id, req.params.id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ error: 'product_not_found' });
    }

    const row = result.rows[0];
    return res.json({
      id: row.id,
      erp_id: row.erp_id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      price: row.price,
      currency: row.currency,
      stock: row.stock,
      data: row.data || {},
    });
  } catch (err) {
    return next(err);
  }
});

publicRouter.get('/collections/:slug', async (req, res, next) => {
  try {
    const collectionRes = await pool.query(
      'select id, name, slug from product_collections where tenant_id = $1 and slug = $2',
      [req.tenant.id, req.params.slug]
    );
    if (!collectionRes.rowCount) {
      return res.status(404).json({ error: 'collection_not_found' });
    }

    const collection = collectionRes.rows[0];
    const productsRes = await pool.query(
      [
        'select p.id, p.erp_id, p.sku, p.name, p.description, p.price, p.currency, p.stock, p.data',
        'from collection_items ci',
        'join product_cache p on p.id = ci.product_id',
        'left join product_overrides o on o.product_id = p.id and o.tenant_id = p.tenant_id',
        'where ci.collection_id = $1 and (o.hidden is null or o.hidden = false)',
        'order by ci.sort_order asc',
      ].join(' '),
      [collection.id]
    );

    const products = productsRes.rows.map((row) => ({
      id: row.id,
      erp_id: row.erp_id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      price: row.price,
      currency: row.currency,
      stock: row.stock,
      data: row.data || {},
    }));

    return res.json({ collection, items: products });
  } catch (err) {
    return next(err);
  }
});
