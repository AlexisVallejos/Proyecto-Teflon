import express from 'express';
import { resolveTenant } from '../middleware/tenant.js';
import { pool } from '../db.js';
import { createPreference } from '../services/mercadopago.js';
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
async function validateItems(tenantId, items, adjustments, isWholesale = false, offers = [], userId = null) {
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
<<<<<<< Updated upstream
    const adjustments = {
      ...normalizePriceAdjustments(settingsRes.rows[0]?.commerce || {}),
      userPercent: userPricePercent,
    };
    const offers = await getTenantOffers(req.tenant.id, { onlyEnabled: true });
    const result = await validateItems(req.tenant.id, req.body.items, adjustments, isWholesale, offers, req.user?.id);
=======
    const adjustments = normalizePriceAdjustments(settingsRes.rows[0]?.commerce || {});
    const result = await validateItems(req.tenant.id, req.body.items, adjustments, pricingProfile);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
    const requestedPayment = req.body?.customer?.payment_method || req.body?.payment_method || null;
    const mode = commerce.mode || 'online';
    const taxRate = Number(commerce.tax_rate || 0);
    const shipping = Number(commerce.shipping_flat || 0);
    const tax = (validation.subtotal + shipping) * taxRate;
    const total = validation.subtotal + shipping + tax;

    await client.query('BEGIN');
    for (const item of validation.items) {
      const stockRes = await client.query(
        [
          'update product_cache',
          'set stock = case when stock is null then null else stock - $1 end, updated_at = now()',
          'where tenant_id = $2 and id = $3 and (stock is null or stock >= $1)',
          'returning stock',
        ].join(' '),
        [item.qty, req.tenant.id, item.product_id]
      );
      if (!stockRes.rowCount) {
        throw new Error(`insufficient_stock:${item.product_id}`);
      }
    }
    const checkoutMode = requestedPayment === 'whatsapp' || mode === 'whatsapp' ? 'whatsapp' : 'online';
    const orderStatus = checkoutMode === 'whatsapp' ? 'submitted' : 'pending_payment';

    const orderRes = await client.query(
      [
        'insert into orders (tenant_id, user_id, status, checkout_mode, currency, subtotal, tax, shipping, total, customer)',
        'values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb) returning id',
      ].join(' '),
      [
        req.tenant.id,
        req.user?.id || null,
        orderStatus,
        checkoutMode,
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

    if (checkoutMode !== 'whatsapp') {
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

    if (checkoutMode === 'whatsapp' || mode !== 'online') {
      const whatsappNumber = String(commerce.whatsapp_number || '').replace(/\D/g, '');
      if (whatsappNumber) {
        const itemsLines = validation.items
          .map((item) => {
            const unitPrice = Number(item.unit_price || 0);
            const lineTotal = Number(item.total != null ? item.total : unitPrice * Number(item.qty || 0));
            return `- ${item.name} (SKU: ${item.sku || item.product_id}) x${item.qty} | ${unitPrice.toFixed(2)} ${validation.currency} | ${lineTotal.toFixed(2)} ${validation.currency}`;
          })
          .join('\n');
        const message = [
          `Pedido ${orderId}`,
          '',
          'Productos:',
          itemsLines,
          '',
          `Total: ${Number(total || 0).toFixed(2)} ${validation.currency}`,
        ].join('\n');
        whatsapp_url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      }
    }

    await client.query('COMMIT');
    return res.json({ order_id: orderId, payment, whatsapp_url });
  } catch (err) {
    await client.query('ROLLBACK');
    if (String(err?.message || '').startsWith('insufficient_stock:')) {
      return res.status(400).json({ valid: false, errors: [err.message] });
    }
    return next(err);
  } finally {
    client.release();
  }
});
