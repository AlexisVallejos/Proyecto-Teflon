import express from 'express';
import { pool } from '../db.js';
import { resolveTenant } from '../middleware/tenant.js';

export const settingsRouter = express.Router();
export const settingsAdminRouter = express.Router();

settingsRouter.use(resolveTenant);
settingsAdminRouter.use(resolveTenant);

const ALLOWED_MODES = new Set(['whatsapp', 'transfer', 'both']);

function normalizeCheckoutSettings(commerce = {}) {
  const fallbackMode = commerce.checkout_mode || commerce.mode || 'whatsapp';
  const mode = ALLOWED_MODES.has(fallbackMode)
    ? fallbackMode
    : fallbackMode === 'hybrid'
      ? 'both'
      : 'whatsapp';

  const bankTransfer = commerce.bank_transfer || {};

  return {
    mode,
    whatsapp_number: commerce.whatsapp_number || '',
    whatsapp_template: commerce.whatsapp_template || '',
    bank_transfer: {
      cbu: bankTransfer.cbu || '',
      alias: bankTransfer.alias || '',
      bank: bankTransfer.bank || '',
      holder: bankTransfer.holder || '',
    },
  };
}

function sanitizeCheckoutPayload(payload = {}) {
  const mode = ALLOWED_MODES.has(payload.mode) ? payload.mode : null;
  const whatsappNumber = payload.whatsapp_number != null ? String(payload.whatsapp_number).trim() : null;
  const whatsappTemplate = payload.whatsapp_template != null ? String(payload.whatsapp_template).trim() : null;
  const bankTransfer = payload.bank_transfer || {};

  return {
    ...(mode ? { checkout_mode: mode } : {}),
    ...(whatsappNumber !== null ? { whatsapp_number: whatsappNumber } : {}),
    ...(whatsappTemplate !== null ? { whatsapp_template: whatsappTemplate } : {}),
    ...(payload.bank_transfer
      ? {
          bank_transfer: {
            cbu: bankTransfer.cbu ? String(bankTransfer.cbu).trim() : '',
            alias: bankTransfer.alias ? String(bankTransfer.alias).trim() : '',
            bank: bankTransfer.bank ? String(bankTransfer.bank).trim() : '',
            holder: bankTransfer.holder ? String(bankTransfer.holder).trim() : '',
          },
        }
      : {}),
  };
}

settingsRouter.get('/checkout', async (req, res, next) => {
  try {
    const result = await pool.query(
      'select commerce from tenant_settings where tenant_id = $1',
      [req.tenant.id]
    );
    const commerce = (result.rows[0] && result.rows[0].commerce) || {};
    return res.json(normalizeCheckoutSettings(commerce));
  } catch (err) {
    return next(err);
  }
});

settingsAdminRouter.put('/checkout', async (req, res, next) => {
  try {
    const updates = sanitizeCheckoutPayload(req.body || {});
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'settings_required' });
    }

    const updateRes = await pool.query(
      [
        'update tenant_settings',
        'set commerce = commerce || $2::jsonb,',
        'updated_at = now()',
        'where tenant_id = $1',
        'returning commerce',
      ].join(' '),
      [req.tenant.id, updates]
    );

    if (!updateRes.rowCount) {
      return res.status(404).json({ error: 'tenant_settings_not_found' });
    }

    return res.json(normalizeCheckoutSettings(updateRes.rows[0].commerce));
  } catch (err) {
    return next(err);
  }
});
