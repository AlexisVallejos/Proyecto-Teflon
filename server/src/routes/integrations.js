import { Router } from 'express';

import { syncProductsController } from '../controllers/integration.controller.js';
import { requireApiScope, validateApiKey } from '../middleware/apiKey.js';
import { buildProductSyncSchema, resolveServerBaseUrl } from '../services/integrationManifest.js';
import { ensureProductSyncSchema } from '../services/integration.service.js';

export const integrationsRouter = Router();

integrationsRouter.use(async (req, res, next) => {
  try {
    await ensureProductSyncSchema();
    return next();
  } catch (err) {
    return next(err);
  }
});

integrationsRouter.get('/schema/product', (req, res) => {
  const baseUrl = resolveServerBaseUrl(req);
  return res.json(buildProductSyncSchema(baseUrl));
});

integrationsRouter.get('/ping', validateApiKey, requireApiScope('products:sync'), (req, res) => {
  return res.json({
    ok: true,
    tenant_id: req.tenantId,
    token_name: req.apiKey?.name || null,
    scope: req.apiKey?.scope || null,
    server_time: new Date().toISOString(),
  });
});

integrationsRouter.post('/products/sync', validateApiKey, requireApiScope('products:sync'), syncProductsController);
