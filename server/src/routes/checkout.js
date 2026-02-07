import express from 'express';
import { resolveTenant } from '../middleware/tenant.js';
import { pool } from '../db.js';
import { createPreference } from '../services/mercadopago.js';

export const checkoutRouter = express.Router();

checkoutRouter.use(resolveTenant);

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.product_id)
    .map((item) => ({
      product_id: item.product_id,
      qty: Math.max(1, Number(item.qty || 1)),
    }));
}

async function validateItems(tenantId, items, isWholesale = false) {
  const normalized = normalizeItems(items);
  const ids = normalized.map((item) => item.product_id);

  if (!ids.length) {
    return { valid: false, errors: ['empty_items'] };
  }

  const result = await pool.query(
    'select id, sku, name, price, price_wholesale, currency, stock from product_cache where tenant_id = $1 and id = ANY($2::uuid[])',
    [tenantId, ids]
  );

  const products = result.rows;
  const errors = [];
  let currency = null;
  let subtotal = 0;

  const lineItems = normalized.map((item) => {
    const product = products.find((row) => row.id === item.product_id);
    if (!product) {
      errors.push(`product_not_found:${item.product_id}`);
      return null;
    }

    if (product.stock < item.qty) {
      errors.push(`insufficient_stock:${product.id}`);
    }

    currency = currency || product.currency;
    const unitPrice = (isWholesale && product.price_wholesale) ? Number(product.price_wholesale) : Number(product.price);
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
  }).filter(Boolean);

  return {
    valid: errors.length === 0,
    currency: currency || 'ARS',
    subtotal,
    items: lineItems,
    errors,
  };
}

checkoutRouter.post('/validate', async (req, res, next) => {
  try {
    const isWholesale = req.user?.role === 'wholesale';
    const result = await validateItems(req.tenant.id, req.body.items, isWholesale);
    if (!result.valid) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

checkoutRouter.post('/create', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const isWholesale = req.user?.role === 'wholesale';
    const validation = await validateItems(req.tenant.id, req.body.items, isWholesale);
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    const settingsRes = await pool.query(
      'select commerce from tenant_settings where tenant_id = $1',
      [req.tenant.id]
    );
    const commerce = (settingsRes.rows[0] && settingsRes.rows[0].commerce) || {};
    const mode = commerce.mode || 'online';
    const taxRate = Number(commerce.tax_rate || 0);
    const shipping = Number(commerce.shipping_flat || 0);
    const tax = (validation.subtotal + shipping) * taxRate;
    const total = validation.subtotal + shipping + tax;

    await client.query('BEGIN');
    const orderRes = await client.query(
      [
        'insert into orders (tenant_id, status, currency, subtotal, tax, shipping, total, customer)',
        'values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) returning id',
      ].join(' '),
      [
        req.tenant.id,
        'pending_payment',
        validation.currency,
        validation.subtotal,
        tax,
        shipping,
        total,
        req.body.customer || {},
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

    let payment = null;
    let whatsapp_url = null;

    if (mode !== 'whatsapp') {
      const preference = await createPreference({
        items: validation.items.map((item) => ({
          title: item.name,
          quantity: item.qty,
          unit_price: Number(item.unit_price),
          currency_id: validation.currency,
        })),
        payer: req.body.customer || {},
        externalReference: orderId,
        notificationUrl: process.env.MP_WEBHOOK_URL || undefined,
        backUrls: {
          success: process.env.MP_SUCCESS_URL || '',
          failure: process.env.MP_FAILURE_URL || '',
          pending: process.env.MP_PENDING_URL || '',
        },
        statementDescriptor: req.tenant.name || 'Storefront',
      });

      payment = {
        provider: 'mercadopago',
        external_id: preference.id,
        init_point: preference.init_point,
      };

      await client.query(
        [
          'insert into payments (tenant_id, order_id, provider, status, external_id, amount, currency, metadata)',
          'values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)',
        ].join(' '),
        [
          req.tenant.id,
          orderId,
          'mercadopago',
          'pending',
          preference.id,
          total,
          validation.currency,
          { init_point: preference.init_point },
        ]
      );
    }

    if (mode !== 'online') {
      const whatsappNumber = String(commerce.whatsapp_number || '').replace(/\D/g, '');
      if (whatsappNumber) {
        const message = `Order ${orderId} total ${total}`;
        whatsapp_url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      }
    }

    await client.query('COMMIT');
    return res.json({ order_id: orderId, payment, whatsapp_url });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});
