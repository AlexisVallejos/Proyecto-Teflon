import { syncIntegrationProducts } from '../services/integration.service.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const resolveIntegrationTenantId = (req) => {
  const tokenTenantId = String(req.tenantId || req.apiKey?.tenant_id || '').trim();
  const headerTenantId = String(req.get('x-tenant-id') || '').trim();

  if (tokenTenantId && headerTenantId && tokenTenantId !== headerTenantId) {
    return { error: 'tenant_mismatch' };
  }

  const tenantId = tokenTenantId || headerTenantId || null;
  if (!tenantId) {
    return { error: 'tenant_required' };
  }
  if (!UUID_REGEX.test(tenantId)) {
    return { error: 'invalid_tenant_id' };
  }

  return { tenantId };
};

const resolveItemsPayload = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.products)) return body.products;
  return null;
};

export async function syncProductsController(req, res, next) {
  try {
    const tenantResolution = resolveIntegrationTenantId(req);
    if (tenantResolution.error) {
      const status = tenantResolution.error === 'tenant_mismatch' ? 403 : 400;
      return res.status(status).json({ error: tenantResolution.error });
    }

    const items = resolveItemsPayload(req.body);
    if (!items) {
      return res.status(400).json({ error: 'products_array_required' });
    }

    const invalidItems = items.reduce((acc, item, index) => {
      if (!isPlainObject(item)) {
        acc.push({ index, error: 'invalid_product_item' });
        return acc;
      }

      const externalId = String(item.external_id ?? item.externalId ?? item.id ?? '').trim();
      if (!externalId) {
        acc.push({ index, error: 'external_id_required' });
      }
      return acc;
    }, []);

    if (invalidItems.length) {
      return res.status(400).json({
        error: 'invalid_products_payload',
        details: invalidItems.slice(0, 25),
      });
    }

    const sourceSystem = String(
      req.body?.source_system ||
      req.body?.sourceSystem ||
      req.get('x-source-system') ||
      'erp'
    ).trim() || 'erp';

    const result = await syncIntegrationProducts({
      tenantId: tenantResolution.tenantId,
      items,
      sourceSystem,
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}
