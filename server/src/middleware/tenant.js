import { pool } from '../db.js';
import { normalizeDomainInput } from '../services/tenantDomains.js';

export async function resolveTenant(req, res, next) {
  try {
    const headerTenant = req.get('x-tenant-id');
    let tenant;

    if (headerTenant) {
      // Validate UUID to prevent DB crash
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(headerTenant)) {
        const result = await pool.query(
          'select id, name from tenants where id = $1 and status = $2',
          [headerTenant, 'active']
        );
        tenant = result.rows[0];
      }
    }

    if (!tenant) {
      const host = normalizeDomainInput(req.hostname || req.get('host') || '');
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
      console.warn(`Tenant not found for header: ${headerTenant} and host: ${req.hostname}`);
      return res.status(404).json({ error: 'tenant_not_found' });
    }

    console.log(`Resolved tenant: ${tenant.name} (${tenant.id})`);
    req.tenant = tenant;
    return next();
  } catch (err) {
    return next(err);
  }
}
