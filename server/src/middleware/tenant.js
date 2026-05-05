import { pool } from '../db.js';
import { normalizeDomainInput } from '../services/tenantDomains.js';

export async function resolveTenant(req, res, next) {
  try {
    const headerTenant = req.get('x-tenant-id');
    const queryTenant = req.query.tenantId;
    const bodyTenant = req.body?.tenant_id;
    const userTenant = req.user?.tenantId;

    const rawTenantId = headerTenant || queryTenant || bodyTenant || userTenant;
    let tenant;

    if (rawTenantId) {
      // Validate UUID to prevent DB crash
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const targetId = String(rawTenantId).trim();

      if (uuidRegex.test(targetId)) {
        const result = await pool.query(
          'select id, name from tenants where id = $1 and status = $2',
          [targetId, 'active']
        );
        tenant = result.rows[0];
      }
    }

    if (!tenant) {
      const forwardedHost = String(
        req.get('x-original-host') ||
        req.get('x-forwarded-host') ||
        req.hostname ||
        req.get('host') ||
        ''
      ).split(',')[0];
      const host = normalizeDomainInput(forwardedHost);
      if (host) {
        const hostCandidates = host.startsWith('www.')
          ? [host, host.slice(4)]
          : [host];
        const result = await pool.query(
          [
            'select t.id, t.name',
            'from tenant_domains d',
            'join tenants t on t.id = d.tenant_id',
            'where d.domain = any($1::text[]) and t.status = $2',
            'order by array_position($1::text[], d.domain) asc',
            'limit 1',
          ].join(' '),
          [hostCandidates, 'active']
        );
        tenant = result.rows[0];
      }
    }

    if (!tenant) {
      const currentHost = String(
        req.get('x-original-host') ||
        req.get('x-forwarded-host') ||
        req.get('host') ||
        req.hostname ||
        ''
      ).toLowerCase();
      const isEditor = currentHost.startsWith('editor.');

      if (isEditor) {
        console.log(`Editor host detected without explicit tenant (${currentHost}). Proceeding with null tenant for ${req.path}`);
        req.tenant = { id: null, name: 'Editor' };
        return next();
      }

      console.warn(`Tenant not found for header: ${headerTenant} and host: ${currentHost}`);
      return res.status(404).json({ error: 'tenant_not_found' });
    }

    console.log(`Resolved tenant: ${tenant.name} (${tenant.id})`);
    req.tenant = tenant;
    return next();
  } catch (err) {
    return next(err);
  }
}
