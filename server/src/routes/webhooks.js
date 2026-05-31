import express from 'express';
import { pool } from '../db.js';

export const webhooksRouter = express.Router();

webhooksRouter.post('/payments', async (req, res, next) => {
  try {
    const eventType = String(req.query.type || req.body.type || 'payment');
    await pool.query(
      'insert into webhook_events (event_type, payload) values ($1, $2::jsonb)',
      [eventType, req.body || {}]
    );
    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
});

webhooksRouter.post('/vase-provision', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.VASE_WEBHOOK_SECRET || 'vase_provision_secret_2026';
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { tenant_id, preview_url } = req.body;
    if (!tenant_id || !preview_url) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const existing = await pool.query(
      'select tenant_id from tenant_settings where tenant_id = $1',
      [tenant_id]
    );

    const brandingUpdate = { 
      preview_url,
      design_preset: 'piquim' // Asignar el preset Piquim para los bloques
    };

    if (!existing.rowCount) {
      await pool.query(
        'insert into tenant_settings (tenant_id, branding, theme, commerce) values ($1, $2::jsonb, $3::jsonb, $4::jsonb)',
        [tenant_id, brandingUpdate, {}, {}]
      );
    } else {
      await pool.query(
        'update tenant_settings set branding = branding || $2::jsonb, updated_at = now() where tenant_id = $1',
        [tenant_id, brandingUpdate]
      );
    }

    return res.json({ ok: true, tenant_id, preview_url });
  } catch (err) {
    return next(err);
  }
});
