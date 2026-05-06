import express from 'express';
import { pool } from '../db.js';
import {
  ensureUserProfileSchema,
  normalizeBillingInfo,
  normalizeProfileFields,
  profileColumnsToSelect,
} from '../services/userProfile.js';

export const meRouter = express.Router();

meRouter.put('/profile', async (req, res, next) => {
  try {
    await ensureUserProfileSchema();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const profile = normalizeProfileFields(req.body || {});
    const displayName = req.body?.name != null
      ? (String(req.body.name).trim().slice(0, 120) || null)
      : undefined;
    const billingInfo = req.body?.billing_info !== undefined
      ? normalizeBillingInfo(req.body.billing_info)
      : undefined;

    const setParts = [];
    const values = [userId];
    let idx = 2;

    const setFieldCoalesce = (column, value) => {
      setParts.push(`${column} = coalesce($${idx}, ${column})`);
      values.push(value);
      idx += 1;
    };
    const setFieldOverride = (column, value) => {
      setParts.push(`${column} = $${idx}`);
      values.push(value);
      idx += 1;
    };

    if (displayName !== undefined) setFieldOverride('display_name', displayName);
    setFieldCoalesce('phone', profile.phone);
    setFieldCoalesce('address', profile.address);
    setFieldCoalesce('address_extra', profile.address_extra);
    setFieldCoalesce('country_code', profile.country_code);
    setFieldCoalesce('country_label', profile.country_label);
    setFieldCoalesce('province', profile.province);
    setFieldCoalesce('city', profile.city);
    setFieldCoalesce('postal_code', profile.postal_code);

    if (billingInfo !== undefined) {
      if (billingInfo === null && req.body?.billing_info !== null) {
        return res.status(400).json({ error: 'invalid_billing_info' });
      }
      setFieldOverride('billing_info', billingInfo || {});
    }

    if (!setParts.length) {
      return res.status(400).json({ error: 'no_fields' });
    }

    const updateRes = await pool.query(
      `update users set ${setParts.join(', ')}
       where id = $1
       returning id, email, role, status, display_name, ${profileColumnsToSelect()}`,
      values
    );

    if (!updateRes.rowCount) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    return res.json({ user: updateRes.rows[0] });
  } catch (err) {
    return next(err);
  }
});
