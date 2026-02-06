import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { publicRouter } from './routes/public.js';
import { tenantRouter } from './routes/tenant.js';
import { adminRouter } from './routes/admin.js';
import { checkoutRouter } from './routes/checkout.js';
import { authRouter } from './routes/auth.js';
import { webhooksRouter } from './routes/webhooks.js';
import { authenticate } from './middleware/auth.js';

dotenv.config();

const app = express();
app.set('trust proxy', true);

const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/public', publicRouter);
app.use('/checkout', checkoutRouter);
app.use('/webhooks', webhooksRouter);

app.use('/tenant', authenticate, tenantRouter);
app.use('/admin', authenticate, adminRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

