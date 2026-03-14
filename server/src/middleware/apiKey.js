import { pool } from '../db.js';

const readApiKeyFromRequest = (req) => {
    const headerKey = String(req.get('x-api-key') || req.query.api_key || '').trim();
    if (headerKey) return headerKey;

    const authHeader = String(req.get('authorization') || '').trim();
    if (/^bearer\s+/i.test(authHeader)) {
        return authHeader.replace(/^bearer\s+/i, '').trim();
    }

    return '';
};

const parseScopeTokens = (scopeValue) =>
    String(scopeValue || '')
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);

export const validateApiKey = async (req, res, next) => {
    const apiKey = readApiKeyFromRequest(req);

    if (!apiKey) {
        return res.status(401).json({ error: 'api_key_required' });
    }

    try {
        const result = await pool.query(
            'select id, tenant_id, name, scope from api_tokens where token_hash = $1',
            [apiKey] // In a real app, this would be hashed
        );

        if (!result.rowCount) {
            return res.status(403).json({ error: 'invalid_api_key' });
        }

        req.apiKey = result.rows[0];
        req.tenantId = req.apiKey.tenant_id;
        next();
    } catch (err) {
        next(err);
    }
};

export const requireApiScope = (expectedScope) => (req, res, next) => {
    const currentScope = String(req.apiKey?.scope || '').trim();
    const currentScopes = parseScopeTokens(currentScope);

    if (!currentScopes.length) {
        return res.status(403).json({ error: 'api_scope_required' });
    }

    if (
        currentScopes.includes('*') ||
        currentScopes.includes(expectedScope)
    ) {
        return next();
    }

    return res.status(403).json({
        error: 'insufficient_api_scope',
        required_scope: expectedScope,
    });
};
