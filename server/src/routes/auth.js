import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authenticate, signToken } from '../middleware/auth.js';

export const authRouter = express.Router();

async function getMembership(userId, tenantId) {
  if (!userId) return null;
  if (tenantId) {
    const membershipRes = await pool.query(
      'select tenant_id, role, status from user_tenants where user_id = $1 and tenant_id = $2',
      [userId, tenantId]
    );
    return membershipRes.rows[0] || null;
  }

  const membershipRes = await pool.query(
    'select tenant_id, role, status from user_tenants where user_id = $1 order by created_at asc limit 1',
    [userId]
  );
  return membershipRes.rows[0] || null;
}

authRouter.post('/bootstrap', async (req, res, next) => {
  try {
    const bootstrapToken = process.env.BOOTSTRAP_TOKEN || '';
    const provided = req.get('x-bootstrap-token') || req.body.token || '';
    if (!bootstrapToken || provided !== bootstrapToken) {
      return res.status(403).json({ error: 'bootstrap_forbidden' });
    }

    const usersRes = await pool.query('select count(*) as total from users');
    if (Number(usersRes.rows[0].total) > 0) {
      return res.status(409).json({ error: 'bootstrap_already_done' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email_password_required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertRes = await pool.query(
      'insert into users (email, password_hash, role, status) values ($1, $2, $3, $4) returning id, email, role, status',
      [email, passwordHash, 'master_admin', 'active']
    );

    const user = insertRes.rows[0];
    const token = signToken({ sub: user.id, role: user.role, status: user.status, tenant_id: null });
    return res.status(201).json({ token, user });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password, tenant_id } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email_password_required' });
    }

    const userRes = await pool.query(
      'select id, email, password_hash, role, status from users where email = $1',
      [email]
    );
    if (!userRes.rowCount) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const user = userRes.rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'user_inactive' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    let tenantId = null;
    let role = user.role;
    let status = user.status || 'active';
    if (user.role !== 'master_admin') {
      const membership = await getMembership(user.id, tenant_id || null);
      if (!membership) {
        return res.status(403).json({ error: 'no_tenant_access' });
      }
      tenantId = membership.tenant_id;
      role = membership.role;
      status = membership.status || 'active';
    }

    const token = signToken({ sub: user.id, role, status, tenant_id: tenantId });
    return res.json({
      token,
      user: { id: user.id, email: user.email, role, status, tenant_id: tenantId },
    });
  } catch (err) {
    return next(err);
  }
});

async function handleSignup(req, res, next) {
  try {
    const { email, password, role, tenant_id } = req.body;
    if (!email || !password || !tenant_id) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const validRoles = ['retail', 'wholesale'];
    const assignedRole = validRoles.includes(role) ? role : 'retail';

    const countRes = await pool.query('select count(*) from users where email = $1', [email]);
    if (parseInt(countRes.rows[0].count) > 0) {
      return res.status(409).json({ error: 'user_exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = await pool.query(
      'insert into users (email, password_hash, role, status) values ($1, $2, $3, $4) returning id, email, role, status',
      [email, passwordHash, assignedRole, 'active']
    );

    const user = userRes.rows[0];
    const membershipStatus = assignedRole === 'wholesale' ? 'pending' : 'active';
    await pool.query(
      'insert into user_tenants (user_id, tenant_id, role, status) values ($1, $2, $3, $4)',
      [user.id, tenant_id, assignedRole, membershipStatus]
    );

    const token = signToken({ sub: user.id, role: assignedRole, status: membershipStatus, tenant_id });
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: assignedRole, status: membershipStatus, tenant_id },
    });
  } catch (err) {
    return next(err);
  }
}

authRouter.post('/signup', handleSignup);
authRouter.post('/register', handleSignup);

authRouter.post('/logout', (req, res) => {
  return res.json({ ok: true });
});

export async function getMeHandler(req, res, next) {
  try {
    const userRes = await pool.query(
      'select id, email, role, status from users where id = $1',
      [req.user.id]
    );
    if (!userRes.rowCount) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const user = userRes.rows[0];
    let tenantId = req.user.tenantId || null;
    let role = user.role;
    let status = user.status || 'active';

    if (user.role !== 'master_admin') {
      const membership = await getMembership(user.id, tenantId);
      if (membership) {
        tenantId = membership.tenant_id;
        role = membership.role;
        status = membership.status || status;
      }
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role,
        status,
        tenant_id: tenantId,
      },
    });
  } catch (err) {
    return next(err);
  }
}

authRouter.get('/me', authenticate, getMeHandler);
