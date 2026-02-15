import express from 'express';
import cors from 'cors';

import { publicRouter } from './routes/public.js';
import { tenantRouter } from './routes/tenant.js';
import { adminRouter } from './routes/admin.js';
import { checkoutRouter } from './routes/checkout.js';
import { authRouter } from './routes/auth.js';
import { webhooksRouter } from './routes/webhooks.js';
import { authenticate, optionalAuthenticate, requireRole } from './middleware/auth.js';

const app = express();
app.set('trust proxy', true);

const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/public', publicRouter);
app.use('/checkout', optionalAuthenticate, checkoutRouter);
app.use('/webhooks', webhooksRouter);

const ADMIN_ROLES = ['tenant_admin', 'master_admin'];
const disableAuth = process.env.DISABLE_AUTH === 'true';

if (disableAuth) {
  console.warn('AUTH DISABLED: /tenant and /admin routes are open without token.');
  app.use('/tenant', tenantRouter);
  app.use('/admin', adminRouter);
} else {
  app.use('/tenant', authenticate, requireRole(ADMIN_ROLES), tenantRouter);
  app.use('/admin', authenticate, adminRouter);
}

export default app;
