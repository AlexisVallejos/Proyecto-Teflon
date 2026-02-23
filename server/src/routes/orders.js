import express from 'express';
import { pool } from '../db.js';
import { resolveTenant } from '../middleware/tenant.js';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { normalizePriceAdjustments, resolveAdjustedPrices } from '../services/pricing.js';
import { getUserPriceAdjustmentPercent } from '../services/user-pricing.js';
import { applyOfferDiscount, getTenantOffers, resolveBestOfferForProduct } from '../services/offers.js';
=======
import { normalizePriceAdjustments } from '../services/pricing.js';
import { resolveEffectiveProductPrice, resolvePricingProfile } from '../services/userPricing.js';
>>>>>>> Stashed changes
=======
import { normalizePriceAdjustments } from '../services/pricing.js';
import { resolveEffectiveProductPrice, resolvePricingProfile } from '../services/userPricing.js';
>>>>>>> Stashed changes
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';

export const ordersRouter = express.Router();
export const adminOrdersRouter = express.Router();

ordersRouter.use(resolveTenant);
adminOrdersRouter.use(resolveTenant);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const paymentsDir = path.join(__dirname, '..', '..', 'uploads', 'payments');

if (!fs.existsSync(paymentsDir)) {
  fs.mkdirSync(paymentsDir, { recursive: true });
}

const proofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, paymentsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const proofUpload = multer({
  storage: proofStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten comprobantes (JPG, PNG, WebP, GIF, PDF)'));
    }
  },
});

const ALLOWED_MODES = new Set(['whatsapp', 'transfer', 'both']);
const ALLOWED_STATUSES = new Set([
  'submitted',
  'pending_payment',
  'paid',
  'processing',
  'unpaid',
  'cancelled',
  'draft',
]);

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.product_id)
    .map((item) => ({
      product_id: item.product_id,
      qty: Math.max(1, Number(item.qty || 1)),
    }));
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
async function validateItems(tenantId, items, adjustments, allowWholesale = false, offers = [], userId = null) {
=======
async function validateItems(tenantId, items, adjustments, pricingProfile) {
>>>>>>> Stashed changes
=======
async function validateItems(tenantId, items, adjustments, pricingProfile) {
>>>>>>> Stashed changes
  const normalized = normalizeItems(items);
  const ids = normalized.map((item) => item.product_id);

  if (!ids.length) {
    return { valid: false, errors: ['empty_items'] };
  }

  const result = await pool.query(
    [
      'select p.id, p.sku, p.name, p.price, p.price_wholesale, p.currency, p.stock,',
      "coalesce((select array_agg(pc.category_id) from product_categories pc where pc.product_id = p.id), '{}'::uuid[]) as category_ids",
      'from product_cache p',
      'where p.tenant_id = $1 and p.id = ANY($2::uuid[])',
    ].join(' '),
    [tenantId, ids]
  );

  const products = result.rows;
  const errors = [];
  let currency = null;
  let subtotal = 0;

  const lineItems = normalized
    .map((item) => {
      const product = products.find((row) => row.id === item.product_id);
      if (!product) {
        errors.push(`product_not_found:${item.product_id}`);
        return null;
      }

      if (product.stock < item.qty) {
        errors.push(`insufficient_stock:${product.id}`);
      }

      currency = currency || product.currency;
      const { effective } = resolveEffectiveProductPrice({
        priceRetail: product.price,
        priceWholesale: product.price_wholesale,
        profile: pricingProfile,
        adjustments,
      });
      const bestOffer = resolveBestOfferForProduct({
        offers,
        userId,
        categoryIds: product.category_ids || [],
      });
      const unitPrice = Number(applyOfferDiscount(effective, bestOffer.percent) || 0);
      subtotal += unitPrice * item.qty;

      return {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        qty: item.qty,
        unit_price: unitPrice,
        total: unitPrice * item.qty,
        currency: product.currency,
      };
    })
    .filter(Boolean);

  return {
    valid: errors.length === 0,
    currency: currency || 'ARS',
    subtotal,
    items: lineItems,
    errors,
  };
}

function resolveCheckoutMode(settings = {}, requested = '') {
  const rawMode = settings.checkout_mode || settings.mode || 'whatsapp';
  const normalized =
    rawMode === 'hybrid'
      ? 'both'
      : ALLOWED_MODES.has(rawMode)
        ? rawMode
        : 'whatsapp';

  if (normalized === 'both') {
    return requested === 'transfer' ? 'transfer' : 'whatsapp';
  }
  return normalized === 'transfer' ? 'transfer' : 'whatsapp';
}

function buildWhatsAppMessage(order, template, currency) {
  const itemsLines = order.items
    .map((item) => {
      const unitPrice = Number(item.unit_price || 0);
      const lineTotal = Number(item.total != null ? item.total : unitPrice * Number(item.qty || 0));
      return `- ${item.name} (SKU: ${item.sku || item.product_id}) x${item.qty} | ${unitPrice.toFixed(2)} ${currency} | ${lineTotal.toFixed(2)} ${currency}`;
    })
    .join('\n');

  const payload = {
    items: itemsLines,
    total: order.total?.toFixed?.(2) || String(order.total || ''),
    currency,
    name: order.customer?.full_name || order.customer?.fullName || '',
    phone: order.customer?.phone || '',
    address: order.customer?.fullAddress || order.customer?.line1 || '',
  };

  if (!template) {
    return [
      'Pedido nuevo',
      payload.name ? `Cliente: ${payload.name}` : null,
      payload.phone ? `Teléfono: ${payload.phone}` : null,
      payload.address ? `Dirección: ${payload.address}` : null,
      '',
      'Productos:',
      payload.items,
      '',
      `Total: ${payload.total} ${payload.currency}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return template
    .replace(/{{\s*items\s*}}/gi, payload.items)
    .replace(/{{\s*total\s*}}/gi, payload.total)
    .replace(/{{\s*currency\s*}}/gi, payload.currency)
    .replace(/{{\s*name\s*}}/gi, payload.name)
    .replace(/{{\s*phone\s*}}/gi, payload.phone)
    .replace(/{{\s*address\s*}}/gi, payload.address);
}

ordersRouter.post('/submit', async (req, res, next) => {
  const client = await pool.connect();
  try {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const isWholesale = req.user?.role === 'wholesale' && req.user?.status === 'active';
    const userPricePercent = await getUserPriceAdjustmentPercent(req.tenant.id, req.user?.id);
=======
=======
>>>>>>> Stashed changes
    const pricingProfile = await resolvePricingProfile({
      tenantId: req.tenant.id,
      user: req.user,
    });
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    const settingsRes = await pool.query(
      'select commerce from tenant_settings where tenant_id = $1',
      [req.tenant.id]
    );
    const commerce = (settingsRes.rows[0] && settingsRes.rows[0].commerce) || {};
<<<<<<< Updated upstream
    const adjustments = {
      ...normalizePriceAdjustments(commerce),
      userPercent: userPricePercent,
    };
    const offers = await getTenantOffers(req.tenant.id, { onlyEnabled: true });
    const validation = await validateItems(req.tenant.id, req.body.items, adjustments, isWholesale, offers, req.user?.id);
=======
    const adjustments = normalizePriceAdjustments(commerce);
    const validation = await validateItems(req.tenant.id, req.body.items, adjustments, pricingProfile);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    const requestedMode = String(
      req.body.checkout_mode || req.body.payment_method || req.body?.customer?.payment_method || ''
    ).toLowerCase();
    const checkoutMode = resolveCheckoutMode(commerce, requestedMode);

    const taxRate = Number(commerce.tax_rate || 0);
    const shipping = Number(commerce.shipping_flat || 0);
    const tax = (validation.subtotal + shipping) * taxRate;
    const total = validation.subtotal + shipping + tax;

    const customer = req.body.customer || {};
    const status = checkoutMode === 'transfer' ? 'pending_payment' : 'submitted';

    await client.query('BEGIN');
    const orderRes = await client.query(
      [
        'insert into orders (tenant_id, user_id, status, checkout_mode, currency, subtotal, tax, shipping, total, customer)',
        'values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb) returning id',
      ].join(' '),
      [
        req.tenant.id,
        req.user?.id || null,
        status,
        checkoutMode,
        validation.currency,
        validation.subtotal,
        tax,
        shipping,
        total,
        customer,
      ]
    );

    const orderId = orderRes.rows[0].id;

    for (const item of validation.items) {
      await client.query(
        [
          'insert into order_items (order_id, product_id, sku, name, qty, unit_price, total)',
          'values ($1, $2, $3, $4, $5, $6, $7)',
        ].join(' '),
        [orderId, item.product_id, item.sku, item.name, item.qty, item.unit_price, item.total]
      );
    }

    await client.query('COMMIT');

    let whatsappUrl = null;
    if (checkoutMode === 'whatsapp') {
      const number = String(commerce.whatsapp_number || '').replace(/\D/g, '');
      if (number) {
        const message = buildWhatsAppMessage(
          {
            items: validation.items,
            total,
            customer,
          },
          commerce.whatsapp_template || '',
          validation.currency
        );
        whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      }
    }

    return res.json({
      order_id: orderId,
      status,
      checkout_mode: checkoutMode,
      totals: {
        subtotal: validation.subtotal,
        tax,
        shipping,
        total,
        currency: validation.currency,
      },
      whatsapp_url: whatsappUrl,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

ordersRouter.get('/mine', async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const ordersRes = await pool.query(
      [
        'select id, user_id, status, checkout_mode, currency, subtotal, tax, shipping, total, customer, created_at',
        'from orders',
        'where tenant_id = $1 and user_id = $2',
        'order by created_at desc',
        'limit $3 offset $4',
      ].join(' '),
      [req.tenant.id, req.user.id, limit, offset]
    );

    const orderIds = ordersRes.rows.map((row) => row.id);
    let itemsByOrder = {};

    if (orderIds.length) {
      const itemsRes = await pool.query(
        [
          'select order_id, product_id, sku, name, qty, unit_price, total',
          'from order_items',
          'where order_id = ANY($1::uuid[])',
          'order by name asc',
        ].join(' '),
        [orderIds]
      );

      itemsByOrder = itemsRes.rows.reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});
    }

    const items = ordersRes.rows.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));

    return res.json({ items, limit, offset });
  } catch (err) {
    return next(err);
  }
});

ordersRouter.post('/:id/proof', proofUpload.single('proof'), async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return res.status(400).json({ error: 'invalid_order_id' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'proof_required' });
    }

    const result = await pool.query(
      'select id, user_id, customer, total, currency, checkout_mode from orders where tenant_id = $1 and id = $2',
      [req.tenant.id, orderId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'order_not_found' });
    }

    const order = result.rows[0];
    if (req.user?.id && order.user_id && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const proofUrl = `${protocol}://${host}/uploads/payments/${req.file.filename}`;

    await pool.query(
      [
        'update orders',
        'set customer = jsonb_set(coalesce(customer, \'{}\'::jsonb), \'{payment_proof_url}\', to_jsonb($3::text), true)',
        'where tenant_id = $1 and id = $2',
      ].join(' '),
      [req.tenant.id, orderId, proofUrl]
    );

    const paymentMeta = { proof_url: proofUrl };
    const paymentRes = await pool.query(
      'select id, provider, status from payments where tenant_id = $1 and order_id = $2 order by created_at desc limit 1',
      [req.tenant.id, orderId]
    );

    if (paymentRes.rowCount) {
      const payment = paymentRes.rows[0];
      const nextProvider = payment.provider || 'manual';
      const nextStatus = payment.provider === 'mercadopago' ? payment.status : 'proof_submitted';
      await pool.query(
        [
          'update payments',
          'set provider = $1,',
          'status = $2,',
          'amount = $3,',
          'currency = $4,',
          'metadata = metadata || $5::jsonb',
          'where id = $6',
        ].join(' '),
        [
          nextProvider,
          nextStatus,
          Number(order.total || 0),
          order.currency || 'ARS',
          paymentMeta,
          payment.id,
        ]
      );
    } else {
      await pool.query(
        [
          'insert into payments (tenant_id, order_id, provider, status, amount, currency, metadata)',
          'values ($1, $2, $3, $4, $5, $6, $7::jsonb)',
        ].join(' '),
        [
          req.tenant.id,
          orderId,
          'manual',
          'proof_submitted',
          Number(order.total || 0),
          order.currency || 'ARS',
          paymentMeta,
        ]
      );
    }

    return res.json({ ok: true, proof_url: proofUrl });
  } catch (err) {
    return next(err);
  }
});

adminOrdersRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const userId = req.query.user_id || null;

    const params = [req.tenant.id];
    let where = 'tenant_id = $1';

    if (userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return res.status(400).json({ error: 'invalid_user_id' });
      }
      params.push(userId);
      where += ` and user_id = $${params.length}`;
    }

    const ordersRes = await pool.query(
      [
        'select id, user_id, status, checkout_mode, currency, subtotal, tax, shipping, total, customer, created_at',
        'from orders',
        `where ${where}`,
        'order by created_at desc',
        `limit $${params.length + 1} offset $${params.length + 2}`,
      ].join(' '),
      [...params, limit, offset]
    );

    const orderIds = ordersRes.rows.map((row) => row.id);
    let itemsByOrder = {};

    if (orderIds.length) {
      const itemsRes = await pool.query(
        [
          'select order_id, product_id, sku, name, qty, unit_price, total',
          'from order_items',
          'where order_id = ANY($1::uuid[])',
          'order by name asc',
        ].join(' '),
        [orderIds]
      );

      itemsByOrder = itemsRes.rows.reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});
    }

    const items = ordersRes.rows.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));

    return res.json({ items, limit, offset });
  } catch (err) {
    return next(err);
  }
});

adminOrdersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return res.status(400).json({ error: 'invalid_order_id' });
    }

    const rawStatus = String(req.body?.status || '').trim().toLowerCase();
    if (!ALLOWED_STATUSES.has(rawStatus)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    const result = await pool.query(
      [
        'update orders',
        'set status = $1',
        'where tenant_id = $2 and id = $3',
        'returning id, status, checkout_mode, total, currency',
      ].join(' '),
      [rawStatus, req.tenant.id, orderId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'order_not_found' });
    }

    return res.json({ ok: true, order: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});
