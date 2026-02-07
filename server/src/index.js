import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

import { publicRouter } from './routes/public.js';
import { tenantRouter } from './routes/tenant.js';
import { adminRouter } from './routes/admin.js';
import { checkoutRouter } from './routes/checkout.js';
import { authRouter } from './routes/auth.js';
import { webhooksRouter } from './routes/webhooks.js';
import { authenticate, optionalAuthenticate } from './middleware/auth.js';

const app = express();
app.set('trust proxy', true);

// Verify DB connection on startup
const dbHost = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'NOT SET';
console.log(`Checking DB connection to: ${dbHost}`);
pool.query('SELECT 1').then(() => console.log('DB Connection OK')).catch(e => console.error('DB Connection FAILED:', e.message));

const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/public', publicRouter);
app.use('/checkout', optionalAuthenticate, checkoutRouter);
app.use('/webhooks', webhooksRouter);

app.use('/tenant', authenticate, tenantRouter);
app.use('/admin', authenticate, adminRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

