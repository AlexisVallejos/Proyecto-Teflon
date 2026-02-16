import express from 'express';
import { pool } from '../db.js';
import { resolveTenant } from '../middleware/tenant.js';
import { normalizePriceAdjustments, resolveAdjustedPrices } from '../services/pricing.js';

export const ordersRouter = express.Router();
export const adminOrdersRouter = express.Router();

ordersRouter.use(resolveTenant);
adminOrdersRouter.use(resolveTenant);

const ALLOWED_MODES = new Set(['whatsapp', 'transfer', 'both']);

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.product_id)
    .map((item) => ({
      product_id: item.product_id,
      qty: Math.max(1, Number(item.qty || 1)),
    }));
}

async function validateItems(tenantId, items, adjustments, allowWholesale = false) {
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
      const { effective } = resolveAdjustedPrices({
        priceRetail: product.price,
        priceWholesale: product.price_wholesale,
        allowWholesale,
        adjustments,
      });
      const unitPrice = Number(effective || 0);
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
    .map((item) => `- ${item.name} (SKU: ${item.sku || item.product_id}) x${item.qty}`)
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
    const isWholesale = req.user?.role === 'wholesale' && req.user?.status === 'active';
    const settingsRes = await pool.query(
      'select commerce from tenant_settings where tenant_id = $1',
      [req.tenant.id]
    );
    const commerce = (settingsRes.rows[0] && settingsRes.rows[0].commerce) || {};
    const adjustments = normalizePriceAdjustments(commerce);
    const validation = await validateItems(req.tenant.id, req.body.items, adjustments, isWholesale);
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

adminOrdersRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const ordersRes = await pool.query(
      [
        'select id, user_id, status, checkout_mode, currency, subtotal, tax, shipping, total, customer, created_at',
        'from orders',
        'where tenant_id = $1',
        'order by created_at desc',
        'limit $2 offset $3',
      ].join(' '),
      [req.tenant.id, limit, offset]
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
